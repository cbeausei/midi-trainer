class App {
  async start() {
    // Request access to a MIDI connected keyboard.
    const access = await navigator.requestMIDIAccess();
    const inputs = access.inputs;
    for (const input of inputs.values()) {
      // Select first one.
      // TODO: let the user select it in case of multiple ones.
      this.initMidi(input);
      break;
    }

    // Remove the start button.
    this.startDiv_ = document.getElementById('start');
    this.startDiv_.style.display = 'none';

    // Start the sound player module.
    this.soundPlayer_ = new SoundPlayer(DEFAULT_VOLUME, DEFAULT_INSTRUMENT);

    // Start visualization.
    this.sections_ = document.getElementById('sections');
    this.sections_.style.display = 'block';
    this.vizTimeDiv_ = document.getElementById('viz-time');
    this.vizFreqDiv_ = document.getElementById('viz-freq');
    this.timeVisualizer_ = new SoundVisualizer(this.vizTimeDiv_, this.soundPlayer_, 'time');
    this.timeVisualizer_.play();
    this.freqVisualizer_ = new SoundVisualizer(this.vizFreqDiv_, this.soundPlayer_, 'freq');
    this.freqVisualizer_.play();

    // Played notes.
    this.notesDiv_ = document.getElementById('notes');
    this.chromaticScaleConvention_ = DEFAULT_CHROMATIC_SCALE_CONVENTION;

    // Menu.
    this.menuDiv_ = document.getElementById('menu');
    this.menuIconDiv_ = document.getElementById('menu-icon');
    this.menuIconDiv_.style.display = 'block';

    // MDC elements.
    this.playVizTooltip_ = new mdc.tooltip.MDCTooltip(document.getElementById('play-viz-tooltip'));
    this.pauseVizTooltip_ = new mdc.tooltip.MDCTooltip(document.getElementById('pause-viz-tooltip'));
  }

  /**
   * Inits the MIDI input by binding a message handler.
   * @param {!MIDIInput} input
   */
  initMidi(input) {
    input.onmidimessage = ((classObject) => ((event) => classObject.messageHandler(event,
    classObject)))(this);
  }

  /**
   * Handles a MIDI message.
   * First byte:
   *   - first 4 bits: message type
   *   - last 4 bits: channel
   * Second byte: note number (e.g. 60 -> C4)
   * Third byte: velocity (0 - 127)
   */
  messageHandler(event, classObject) {
    switch (event.data[0] & 0xf0) {
      case 0x90:
        if (event.data[2] !== 0) {
          classObject.noteOn(event.data[1]);
          return;
        }
      case 0x80:
        classObject.noteOff(event.data[1]);
        return;
    }
  }

  /**
   * @param {number} note
   */
  noteOn(note) {
    this.soundPlayer_.addNote(note);
    this.displayNotes();
  }

  /**
   * @param {number} note
   */
  noteOff(note) {
    this.soundPlayer_.removeNote(note);
    this.displayNotes();
  }

  displayNotes() {
    const notes = this.soundPlayer_.getActiveNotes().sort().map(note => this.displayNote(note));
    this.notesDiv_.innerHTML = notes.join(', ');
  }

  /**
   * @param {number} note
   */
  displayNote(note) {
    const notation = NOTE_NAMES.get(this.chromaticScaleConvention_)[note % 12];
    const octave = Math.trunc(note / 12) - 1;
    return `<span note-name>${notation}</span><span note-octave>${octave}</span>`;
  }

  playVisualization() {
    this.timeVisualizer_.play();
    this.freqVisualizer_.play();
  }

  pauseVisualization() {
    this.timeVisualizer_.pause();
    this.freqVisualizer_.pause();
  }

  openMenu() {
    this.menuDiv_.style.display = 'block';    
  }

  closeMenu() {
    this.menuDiv_.style.display = 'none';
  }
}

const app = new App();
