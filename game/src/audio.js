// Midnight Vault — audio: synthesized WebAudio bleeps only, no assets.
// The context starts on the first user gesture; every sound is an
// oscillator envelope so the game loads nothing over the network.

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.alarmTimer = 0;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, vol, when = 0) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  step() {
    this.tone(190, 0.05, 'triangle', 0.04);
  }

  pickup() {
    this.tone(880, 0.12, 'sine', 0.14);
    this.tone(1318, 0.16, 'sine', 0.12, 0.07);
  }

  vaultTick() {
    this.tone(520, 0.05, 'square', 0.05);
  }

  vaultOpen() {
    this.tone(392, 0.14, 'triangle', 0.14);
    this.tone(523, 0.14, 'triangle', 0.14, 0.1);
    this.tone(659, 0.22, 'triangle', 0.14, 0.2);
  }

  smokePuff() {
    this.tone(140, 0.25, 'sawtooth', 0.05);
  }

  empZap() {
    this.tone(1200, 0.08, 'square', 0.08);
    this.tone(300, 0.2, 'square', 0.08, 0.06);
  }

  caughtSting() {
    this.tone(220, 0.3, 'sawtooth', 0.16);
    this.tone(174, 0.5, 'sawtooth', 0.16, 0.18);
  }

  winFanfare() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.14, i * 0.12));
  }

  // Short alarm blip while the meter is high; call every frame.
  alarmBlip(dt, level) {
    if (!this.ctx || level < 30) return;
    this.alarmTimer -= dt;
    if (this.alarmTimer <= 0) {
      this.alarmTimer = level >= 60 ? 0.45 : 0.9;
      this.tone(level >= 60 ? 980 : 740, 0.09, 'square', 0.06);
    }
  }
}
