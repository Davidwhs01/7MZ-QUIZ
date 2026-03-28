/**
 * Utility for synthesizing simple game sound effects using the Web Audio API.
 * This avoids needing external MP3 files while providing low-latency audio feedback.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.connect(this.ctx.destination);
    this.masterVolume.gain.value = 0.4;
  }

  private createOscillator(freq: number, type: OscillatorType = 'sine', duration: number = 0.1) {
    if (!this.ctx || !this.masterVolume) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterVolume);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playCorrect() {
    this.init();
    // Two quick ascending notes
    this.createOscillator(523.25, 'sine', 0.1); // C5
    setTimeout(() => this.createOscillator(659.25, 'sine', 0.15), 50); // E5
  }

  playWrong() {
    this.init();
    // Low, descending note
    this.createOscillator(220.00, 'triangle', 0.3); // A3
    if (this.ctx) {
      this.createOscillator(180, 'triangle', 0.3);
    }
  }

  playCombo() {
    this.init();
    // Rapid fire of high notes
    const now = this.ctx?.currentTime || 0;
    [880, 1046, 1318].forEach((freq, i) => {
      setTimeout(() => this.createOscillator(freq, 'sine', 0.1), i * 60);
    });
  }

  playGameOver() {
    this.init();
    // Somber triad
    this.createOscillator(196.00, 'sawtooth', 0.5); // G3
    setTimeout(() => this.createOscillator(164.81, 'sawtooth', 0.5), 200); // E3
    setTimeout(() => this.createOscillator(130.81, 'sawtooth', 0.6), 400); // C3
  }
}

export const sfx = new SoundEngine();
