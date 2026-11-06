import { execSync } from 'child_process';

const ADB = 'C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = 'RXCTC02HNKJ';

function adb(cmd) {
  try {
    return execSync(`"${ADB}" -s ${SERIAL} ${cmd}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch (e) {
    return e.stdout ? e.stdout.toString() : '';
  }
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

function getAlarmServiceStatus() {
  const services = adb('shell dumpsys activity services com.opentick.app');
  const isRunning = services.includes('.AlarmService');
  const isForeground = services.includes('isForeground=true');
  return { isRunning, isForeground };
}

function getTopActivity() {
  const actDump = adb('shell dumpsys activity activities');
  const match = actDump.match(/ResumedActivity: ActivityRecord\{[^\}]*\}/);
  return match ? match[0] : 'unknown';
}

async function testCurrentMinute() {
  console.log('Testing Current Minute scheduling...');
  adb('logcat -c');

  const evalCode = `(async () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = \`\${now.getFullYear()}-\${pad(now.getMonth() + 1)}-\${pad(now.getDate())}\`;
    const curTimeStr = \`\${pad(now.getHours())}:\${pad(now.getMinutes())}\`;

    const sampleTask = {
      id: 'task_cur_min_verify',
      title: 'Current Minute Verification',
      dueDate: todayStr,
      recurringDates: [todayStr],
      startTime: curTimeStr,
      completed: false
    };

    // OpenTick logic
    const nowDate = new Date();
    const [hours, minutes] = sampleTask.startTime.split(':').map(Number);
    let nextTimestamp = null;
    if (sampleTask.dueDate === todayStr && nowDate.getHours() === hours && nowDate.getMinutes() === minutes) {
      nextTimestamp = Date.now() + 1500;
    }

    if (nextTimestamp !== null) {
      const res = await window.Capacitor.Plugins.OpenTickAlarm.scheduleAlarm({
        id: sampleTask.id,
        title: sampleTask.title,
        timeMillis: nextTimestamp
      });
      return { scheduled: true, curTimeStr, nextTimestamp, res };
    } else {
      return { scheduled: false, curTimeStr };
    }
  })()`;

  const res = await evaluateInApp(evalCode);
  console.log('Schedule result:', res);

  // Check dumpsys
  const dumpsys = adb('shell dumpsys alarm');
  const hasAlarm = dumpsys.includes('com.opentick.app/.AlarmReceiver');
  console.log('dumpsys alarm has AlarmReceiver:', hasAlarm);

  // Wait 6 seconds
  console.log('Waiting 6s for trigger...');
  await new Promise(r => setTimeout(r, 6000));

  const topAct = getTopActivity();
  const servStatus = getAlarmServiceStatus();
  console.log('Top Activity after 6s:', topAct);
  console.log('AlarmService status after 6s:', servStatus);

  // Stop alarm
  adb('shell am startservice -a com.opentick.app.ACTION_STOP_ALARM -n com.opentick.app/.AlarmService --es EXTRA_TASK_ID task_cur_min_verify');
  console.log('Stopped alarm.');
}

testCurrentMinute().catch(console.error);
