/**
 * AQUAPULSE: Web Audio API Sonar Pinger
 * Down-converts ultrasonic chirp frequencies (100-480 kHz) into human-audible range (800-3200 Hz)
 * to provide real-time acoustic feedback for transmission and echo reception.
 */

class SonarAudioEngine {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playChirp(fStartKhz: number, fEndKhz: number, durationMs: number = 80) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Down-convert ultrasonic scale (e.g. 100-480 kHz -> 800-3200 Hz)
      const audioStart = Math.max(400, (fStartKhz / 480) * 2400 + 400);
      const audioEnd = Math.max(600, (fEndKhz / 480) * 2400 + 600);
      const durationSec = Math.max(0.04, durationMs / 1000);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(audioStart, now);
      osc.frequency.exponentialRampToValueAtTime(audioEnd, now + durationSec);

      // Hann window amplitude envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + durationSec * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec);
    } catch (e) {
      // audio context failure fallback
    }
  }

  public playEchoReturn(delayMs: number = 100, snrDb: number = 20) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime + Math.min(0.8, delayMs / 1000);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sharp pulse compression spike sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1450, now);

      const amp = Math.min(0.25, Math.max(0.02, (snrDb + 10) / 100));
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.085);
    } catch (e) {
      // fallback
    }
  }
}

export const sonarAudio = new SonarAudioEngine();

// EOF: src/utils/audioSonar.ts
