// Ambient Noise, Notification Ringtones & Continuous 5-Minute Long Alarms
class SoundManager {
  constructor() {
    this.ctx = null;
    this.noiseNode = null;
    this.gainNode = null;
    this.isPlayingNoise = false;

    // Continuous Alarm State
    this.currentAudioElement = null;
    this.alarmInterval = null;
    this.alarmTimeout = null;
    this.vibrateInterval = null;
    this.isAlarmRinging = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play short notification tone by name
  playSound(name = 'chime', vol = 0.5) {
    try {
      this.init();
      const now = this.ctx.currentTime;

      if (name === 'chime') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 1.2);
      } else if (name === 'bell') {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(659.25, now); // E5
        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
      } else if (name === 'marimba') {
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(vol * 0.3, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.4);
        });
      } else if (name === 'digital') {
        [1000, 1500].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(vol * 0.15, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.08);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.08);
        });
      }
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playChime() {
    this.playSound('chime', 0.6);
  }

  // ================= CONTINUOUS LONG ALARM ENGINE =================
  // Rings continuously for up to 5 minutes (or until user stops it)
  // Supports custom phone MP3/audio files and synthesized loud alarms
  startContinuousAlarm({
    sound = 'radar',
    customAudioUrl = null,
    volume = 0.8,
    durationMinutes = 5,
    vibration = true,
    onStop = null
  } = {}) {
    this.stopContinuousAlarm();
    this.isAlarmRinging = true;

    // Start repeating vibration if available
    if (vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([600, 250, 600, 250, 600]);
        this.vibrateInterval = setInterval(() => {
          try {
            navigator.vibrate([600, 250, 600, 250, 600]);
          } catch (e) {}
        }, 2200);
      } catch (e) {
        console.warn('Vibration not supported', e);
      }
    }

    // CASE 1: Custom audio file uploaded from phone
    if (sound === 'custom' && customAudioUrl) {
      try {
        const audio = new Audio(customAudioUrl);
        audio.loop = true;
        audio.volume = Math.min(1, Math.max(0, volume));
        audio.play().catch(e => console.warn('Could not auto-play custom audio:', e));
        this.currentAudioElement = audio;
      } catch (e) {
        console.warn('Failed to load custom audio, falling back to radar alarm', e);
        this.startSynthAlarmLoop('radar', volume);
      }
    } else {
      // CASE 2: Built-in synthesized long alarm
      this.startSynthAlarmLoop(sound, volume);
    }

    // Safety timeout: automatically stop after requested duration (default 5 min = 300,000ms)
    const maxMs = (durationMinutes || 5) * 60 * 1000;
    this.alarmTimeout = setTimeout(() => {
      this.stopContinuousAlarm();
      if (onStop) onStop();
    }, maxMs);
  }

  startSynthAlarmLoop(type = 'radar', volume = 0.8) {
    this.init();

    const triggerCycle = () => {
      if (!this.isAlarmRinging) return;
      try {
        const now = this.ctx.currentTime;
        const vol = Math.min(1, Math.max(0.1, volume));

        if (type === 'digital' || type === 'digital_alarm') {
          // 4 rapid digital alarm beeps
          [0, 0.12, 0.24, 0.36].forEach((offset) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1400, now + offset);
            gain.gain.setValueAtTime(vol * 0.35, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.08);
          });
        } else if (type === 'siren') {
          // Dynamic wailing siren sweeping 600Hz to 1300Hz
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.linearRampToValueAtTime(1300, now + 0.45);
          osc.frequency.linearRampToValueAtTime(600, now + 0.9);
          gain.gain.setValueAtTime(vol * 0.25, now);
          gain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.85);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.95);
        } else if (type === 'bell' || type === 'bell_alarm') {
          // Rapid energetic bell strikes
          [0, 0.25, 0.5, 0.75].forEach((offset) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now + offset);
            gain.gain.setValueAtTime(vol * 0.4, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.2);
          });
        } else {
          // Default: RADAR alarm (pulsing energetic tone)
          [0, 0.15].forEach((offset) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(950, now + offset);
            osc.frequency.exponentialRampToValueAtTime(1450, now + offset + 0.12);
            gain.gain.setValueAtTime(vol * 0.5, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.12);
          });
        }
      } catch (e) {
        console.warn('Synth alarm cycle error', e);
      }
    };

    // Play first cycle immediately
    triggerCycle();
    // Repeat every 1.1s indefinitely until user stops
    this.alarmInterval = setInterval(triggerCycle, 1100);
  }

  stopContinuousAlarm() {
    this.isAlarmRinging = false;

    // Stop HTML5 audio element
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {}
      this.currentAudioElement = null;
    }

    // Clear alarm interval loop
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }

    // Clear max duration timeout
    if (this.alarmTimeout) {
      clearTimeout(this.alarmTimeout);
      this.alarmTimeout = null;
    }

    // Stop vibration immediately
    if (this.vibrateInterval) {
      clearInterval(this.vibrateInterval);
      this.vibrateInterval = null;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }

  // ================= FOCUS WHITE/PINK/BROWN NOISE =================
  startNoise(type = 'pink', volume = 0.15) {
    try {
      this.init();
      this.stopNoise();

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      } else if (type === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
      } else if (type === 'brown' || type === 'rain') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

      this.noiseNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.noiseNode.start();
      this.isPlayingNoise = true;
    } catch (e) {
      console.warn('Error starting noise', e);
    }
  }

  setVolume(volume) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  stopNoise() {
    try {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      this.isPlayingNoise = false;
    } catch (e) {
      console.warn('Error stopping noise', e);
    }
  }
}

export const soundManager = new SoundManager();
