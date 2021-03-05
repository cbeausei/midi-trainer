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
    this.vizDiv_ = document.getElementById('viz');
    this.vizDiv_.style.display = 'block';
    this.vizIcon_ = document.getElementById('viz-icon');
    this.vizTimeDiv_ = document.getElementById('viz-time');
    this.vizFreqDiv_ = document.getElementById('viz-freq');
    this.timeVisualizer_ = new SoundVisualizer(this.vizTimeDiv_, this.soundPlayer_, 'time');
    this.timeVisualizer_.play();
    this.freqVisualizer_ = new SoundVisualizer(this.vizFreqDiv_, this.soundPlayer_, 'freq');
    this.freqVisualizer_.play();

    // Menu.
    this.menuDiv_ = document.getElementById('menu');
    this.menuIconDiv_ = document.getElementById('menu-icon');
    this.menuIconDiv_.style.display = 'block';
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
  }

  /**
   * @param {number} note
   */
  noteOff(note) {
    this.soundPlayer_.removeNote(note);
  }

  vizSwitch() {
    this.timeVisualizer_.switch();
    const state = this.freqVisualizer_.switch();
    this.vizIcon_.innerHTML = `${state}_circle_outline`;
  }

  openMenu() {
    this.menuDiv_.style.display = 'block';    
  }

  closeMenu() {
    this.menuDiv_.style.display = 'none';
  }
}

const app = new App();
