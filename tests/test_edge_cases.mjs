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

function stopAlarmAdb(id) {
  try {
    adb(`shell am startservice -a com.opentick.app.ACTION_STOP_ALARM -n com.opentick.app/.AlarmService --es EXTRA_TASK_ID ${id}`);
  } catch (e) {}
}

function getAlarmServiceStatus() {
  const services = adb('shell dumpsys activity services com.opentick.app');
  const isRunning = services.includes('.AlarmService');
  const isForeground = services.includes('isForeground=true');
  return { isRunning, isForeground };
}

function getWindowFocus() {
  const windowDump = adb('shell dumpsys window');
  const match = windowDump.match(/mCurrentFocus=Window\{[^\}]*\}/);
  return match ? match[0] : 'unknown';
}

function getTopActivity() {
  const actDump = adb('shell dumpsys activity activities');
  const match = actDump.match(/ResumedActivity: ActivityRecord\{[^\}]*\}/);
  return match ? match[0] : 'unknown';
}

async function runEdgeCases() {
  console.log('====================================');
  console.log('STARTING EDGE CASES REPRODUCTION TEST');
  console.log('====================================');

  // EDGE CASE 1: Scheduling a task with time set to CURRENT minute
  console.log('\n--- EDGE CASE 1: CURRENT MINUTE SCHEDULING ---');
  adb('logcat -c');

  const evalCurrentMinute = `(async () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = \`\${now.getFullYear()}-\${pad(now.getMonth() + 1)}-\${pad(now.getDate())}\`;
    const curTimeStr = \`\${pad(now.getHours())}:\${pad(now.getMinutes())}\`;

    const sampleTask = {
      id: 'task_cur_min_test',
      title: 'Current Minute Test Task',
      dueDate: todayStr,
      recurringDates: [todayStr],
      startTime: curTimeStr,
      completed: false
    };

    // Test through OpenTick's sync algorithm logic:
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

  const edge1Res = await evaluateInApp(evalCurrentMinute);
  console.log('Edge Case 1 Evaluation Result:', edge1Res);

  // Check dumpsys alarm immediately
  const dumpsys1 = adb('shell dumpsys alarm');
  const hasAlarm1 = dumpsys1.includes('com.opentick.app/.AlarmReceiver');
  console.log('dumpsys alarm registered intent:', hasAlarm1);

  // Wait 3 seconds for 1.5s alarm to trigger
  console.log('Waiting 3s for 1.5s alarm trigger...');
  await new Promise(r => setTimeout(r, 3000));

  // Check if AlarmService / AlarmActivity started
  const focus1 = getWindowFocus();
  const top1 = getTopActivity();
  const serv1 = getAlarmServiceStatus();
  console.log('Focus after 3s:', focus1);
  console.log('Top activity after 3s:', top1);
  console.log('AlarmService running foreground:', serv1);

  const edge1Pass = serv1.isForeground || top1.includes('AlarmActivity') || focus1.includes('AlarmActivity');
  console.log(`EDGE CASE 1 RESULT: ${edge1Pass ? 'PASSED (Scheduled & Rang in 1.5s)' : 'FAILED'}`);

  // Cleanup edge 1
  stopAlarmAdb('task_cur_min_test');
  await new Promise(r => setTimeout(r, 1500));

  // EDGE CASE 2: Stopping an alarm and immediately creating another alarm for same task
  console.log('\n--- EDGE CASE 2: STOP AND IMMEDIATELY RESCHEDULE SAME TASK ---');

  const taskId = 'task_edge_b_reschedule';
  // Step 2.1: Schedule initial alarm for +3s
  console.log('Step 2.1: Scheduling initial alarm for +3s...');
  await evaluateInApp(`(async () => {
    return await window.Capacitor.Plugins.OpenTickAlarm.scheduleAlarm({
      id: '${taskId}',
      title: 'Initial Alarm',
      timeMillis: Date.now() + 3000
    });
  })()`);

  console.log('Waiting 4s for initial alarm to trigger...');
  await new Promise(r => setTimeout(r, 4000));

  const servBeforeStop = getAlarmServiceStatus();
  console.log('AlarmService running before stop:', servBeforeStop);

  // Step 2.2: Stop the alarm
  console.log('Step 2.2: User stops the alarm...');
  await evaluateInApp(`(async () => {
    return await window.Capacitor.Plugins.OpenTickAlarm.stopActiveAlarm({ id: '${taskId}' });
  })()`);
  await new Promise(r => setTimeout(r, 1000));

  const servAfterStop = getAlarmServiceStatus();
  console.log('AlarmService running after stop:', servAfterStop);

  // Step 2.3: IMMEDIATELY (within 1 second) create another alarm for the SAME task for +4s!
  console.log('Step 2.3: Immediately reschedule another alarm for the SAME task for +4s...');
  const rescheduleRes = await evaluateInApp(`(async () => {
    const target = Date.now() + 4000;
    const res = await window.Capacitor.Plugins.OpenTickAlarm.scheduleAlarm({
      id: '${taskId}',
      title: 'Rescheduled Alarm (Immediate)',
      timeMillis: target
    });
    return { target, res };
  })()`);
  console.log('Reschedule call result:', rescheduleRes);

  // Check dumpsys alarm
  const dumpsys2 = adb('shell dumpsys alarm');
  const hasAlarm2 = dumpsys2.includes('com.opentick.app/.AlarmReceiver');
  console.log('dumpsys alarm has rescheduled alarm:', hasAlarm2);

  // Wait 5 seconds
  console.log('Waiting 5s to see if it rings or gets blocked by debounce...');
  await new Promise(r => setTimeout(r, 5000));

  const focusAfterReschedule = getWindowFocus();
  const topAfterReschedule = getTopActivity();
  const servAfterReschedule = getAlarmServiceStatus();
  console.log('Focus after reschedule trigger (+4s):', focusAfterReschedule);
  console.log('Top activity after reschedule trigger:', topAfterReschedule);
  console.log('AlarmService running foreground:', servAfterReschedule);

  const edge2Pass = servAfterReschedule.isForeground || topAfterReschedule.includes('AlarmActivity') || focusAfterReschedule.includes('AlarmActivity');
  console.log(`EDGE CASE 2 RESULT: ${edge2Pass ? 'PASSED (Rings successfully: AlarmStateManager.clearDismissed clears the stopped state on scheduleAlarm)' : 'BLOCKED'}`);

  // Cleanup edge 2
  stopAlarmAdb(taskId);

  console.log('\n====================================');
  console.log('EDGE CASES TEST COMPLETE');
  console.log('====================================');
}

runEdgeCases().catch(console.error);
