const SMOOTH_DOWN = 1;
const SMOOTH_END = 0.05;

class ActiveNote {
  constructor(note, context) {
    this.context_ = context;
    // Create the oscillator.
    this.oscillator_ = context.createOscillator();
    this.oscillator_.setPeriodicWave(this.buildHarmonicWave());
    this.oscillator_.frequency.setTargetAtTime(this.getFreq(note), 0, 0);

    // Add an envelope for smooth fade in / fade out.
    this.envelope_ = context.createGain();
    this.oscillator_.connect(this.envelope_);
    this.envelope_.gain.setTargetAtTime(0.3, 0, 0);
    this.envelope_.gain.setTargetAtTime(0.1, 0.3, SMOOTH_DOWN);
  }

  buildHarmonicWave() {
    const real = [0, 1, 0.22, 0.12, 0.04, 0.01, 0.005];
    const imag = [0, 0, 0, 0, 0, 0, 0];
    return this.context_.createPeriodicWave(real, imag);
  }

  getFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  connect(audioNode) {
    this.envelope_.connect(audioNode);
  }

  start() {
    this.oscillator_.start(0);
  }

  stop() {
    this.envelope_.gain.setTargetAtTime(0, 0, SMOOTH_END);
    setTimeout(async () => {
      await this.oscillator_.stop();
      this.oscillator_.disconnect();
    }, 1000); 
  }
}

class SoundPlayer {
  constructor(volume) {
    // Create audio objects.
    this.context_ = new AudioContext();
    this.activeNotes_ = new Map();
    this.noteMergerNode_ = this.context_.createChannelMerger();
    this.volumeNode_ = this.context_.createGain();
    this.analyser_ = this.context_.createAnalyser();
    this.analyser_.fftSize = 8192;
    const bufferLength = this.analyser_.frequencyBinCount;
    this.dataArray_ = new Uint8Array(bufferLength);

    // Make the node chain.
    this.noteMergerNode_.connect(this.volumeNode_);
    this.volumeNode_.connect(this.analyser_);
    this.analyser_.connect(this.context_.destination);

    // Immediately apply volume.
    this.volumeNode_.gain.setTargetAtTime(volume, 0, 0);
  }

  addNote(note) {
    if (this.activeNotes_.has(note)) {
      return;
    }
    const activeNote = new ActiveNote(note, this.context_);
    activeNote.connect(this.noteMergerNode_);
    activeNote.start();
    this.activeNotes_.set(note, activeNote);
  }

  removeNote(note) {
    if (!this.activeNotes_.has(note)) {
      return;
    }
    this.activeNotes_.get(note).stop();
    this.activeNotes_.delete(note);
  }

  updateVolume(volume) {
    this.volumeNode_.gain.setTargetAtTime(volume, this.context_.currentTime, 0);
  }

  getActiveNotes() {
    return Array.from(this.activeNotes_.keys());
  }
}
