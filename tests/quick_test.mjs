import { execSync } from 'child_process';

const ADB = 'C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = 'RXCTC02HNKJ';

function adb(cmd) {
  return execSync(`"${ADB}" -s ${SERIAL} ${cmd}`, { encoding: 'utf-8' });
}

async function getWsUrl() {
  // Ensure port forward
  try {
    adb('forward tcp:9222 localabstract:webview_devtools_remote_20504');
  } catch (e) {
    // If pid changed, find new pid
    const out = adb('shell cat /proc/net/unix');
    const match = out.match(/@webview_devtools_remote_(\d+)/);
    if (match) {
      adb(`forward tcp:9222 localabstract:${match[0].slice(1)}`);
    }
  }

  const res = await fetch('http://localhost:9222/json');
  const pages = await res.json();
  const page = pages.find(p => p.url.includes('localhost') || p.title.includes('OpenTick'));
  return page.webSocketDebuggerUrl;
}

async function evaluateInApp(expression) {
  const wsUrl = await getWsUrl();
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression, awaitPromise: true, returnByValue: true }
      }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      ws.close();
      if (data.result && data.result.exceptionDetails) {
        reject(data.result.exceptionDetails);
      } else {
        resolve(data.result?.result?.value);
      }
    };
    ws.onerror = reject;
  });
}

async function main() {
  console.log('Testing evaluation in app...');
  const res = await evaluateInApp(`(async () => {
    const now = Date.now();
    const target = now + 15000;
    const res = await window.Capacitor.Plugins.OpenTickAlarm.scheduleAlarm({
      id: 'test_quick_15s',
      title: 'QA Quick 15s Alarm',
      timeMillis: target
    });
    return { success: true, target, res };
  })()`);
  console.log('Schedule result:', res);

  // Check dumpsys alarm
  const dumpsys = adb('shell dumpsys alarm');
  const lines = dumpsys.split('\n').filter(l => l.includes('com.opentick.app'));
  console.log('Dumpsys lines:', lines);

  // Wait 16s
  console.log('Waiting 16 seconds for alarm trigger...');
  await new Promise(r => setTimeout(r, 16000));

  // Check foreground activities or services
  const windowFocus = adb('shell dumpsys window | grep mCurrentFocus');
  console.log('Focus after 16s:', windowFocus.trim());

  // Stop alarm
  console.log('Stopping active alarm...');
  await evaluateInApp(`window.Capacitor.Plugins.OpenTickAlarm.stopActiveAlarm({ id: 'test_quick_15s' })`);
  console.log('Done!');
}

main().catch(console.error);
