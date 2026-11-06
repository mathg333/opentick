import { execSync } from 'child_process';

const ADB = 'C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = 'RXCTC02HNKJ';

function adb(cmd) {
  return execSync(`"${ADB}" -s ${SERIAL} ${cmd}`, { encoding: 'utf-8' });
}

async function getWsUrl() {
  try {
    adb('forward tcp:9222 localabstract:webview_devtools_remote_20504');
  } catch (e) {
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

async function testLockScreen() {
  console.log('--- TEST: Lock Screen Alarm Reproduction ---');
  // 1. Clear logcat
  adb('logcat -c');

  // 2. Schedule alarm for +15s
  console.log('Scheduling alarm for +15s from now...');
  const scheduleRes = await evaluateInApp(`(async () => {
    const now = Date.now();
    const target = now + 15000;
    const res = await window.Capacitor.Plugins.OpenTickAlarm.scheduleAlarm({
      id: 'test_lockscreen_15s',
      title: 'QA Lock Screen 15s Alarm',
      timeMillis: target
    });
    return { target, res };
  })()`);
  console.log('Scheduled:', scheduleRes);

  // 3. Verify dumpsys alarm contains intent
  const dumpsysBefore = adb('shell dumpsys alarm');
  const hasAlarmBefore = dumpsysBefore.includes('com.opentick.app/.AlarmReceiver');
  console.log('Dumpsys contains AlarmReceiver intent:', hasAlarmBefore);

  // 4. Turn screen off
  console.log('Turning screen OFF (keyevent 26)...');
  adb('shell input keyevent 26');
  await new Promise(r => setTimeout(r, 1000));

  const screenStateOff = adb('shell "dumpsys power | grep mWakefulness"').trim();
  console.log('Screen state after keyevent 26:', screenStateOff);

  // 5. Wait 15 seconds for trigger
  console.log('Waiting 15 seconds while screen is locked...');
  await new Promise(r => setTimeout(r, 15000));

  // 6. Check screen state and current window focus
  const screenStateTrigger = adb('shell "dumpsys power | grep mWakefulness"').trim();
  const currentFocus = adb('shell "dumpsys window | grep mCurrentFocus"').trim();
  console.log('Screen state upon trigger:', screenStateTrigger);
  console.log('Current window focus upon trigger:', currentFocus);

  // Check top activity
  const topActivity = adb('shell "dumpsys activity activities | grep -E mResumedActivity"').trim();
  console.log('Top resumed activity:', topActivity);

  // 7. Check logcat for AlarmReceiver and OpenTick logs
  const logs = adb('shell "logcat -d | grep -E \'OpenTick|AlarmReceiver|AlarmService|AlarmActivity\'"');
  console.log('Relevant logs:\n', logs);

  // 8. Stop the alarm
  console.log('Stopping active alarm...');
  adb('shell am startservice -a com.opentick.app.ACTION_STOP_ALARM -n com.opentick.app/.AlarmService --es EXTRA_TASK_ID test_lockscreen_15s');

  // 9. Wake up screen and dismiss keyguard if needed
  adb('shell input keyevent 224'); // WAKEUP
  adb('shell wm dismiss-keyguard');
  console.log('--- Lock Screen Test Finished ---');
}

testLockScreen().catch(console.error);
