class App {
  constructor() {
    // Start the sound player module.
    this.soundPlayer_ = new SoundPlayer(DEFAULT_VOLUME, DEFAULT_INSTRUMENT);

    // Start visualization.
    this.vizTimeDiv_ = document.getElementById('viz-time');
    this.vizFreqDiv_ = document.getElementById('viz-freq');
    this.timeVisualizer_ = new SoundVisualizer(this.vizTimeDiv_, this.soundPlayer_, 'time');
    this.timeVisualizer_.play();
    this.freqVisualizer_ = new SoundVisualizer(this.vizFreqDiv_, this.soundPlayer_, 'freq');
    this.freqVisualizer_.play();

    // Played notes.
    this.notesDiv_ = document.getElementById('notes');
    this.chromaticScaleConvention_ = DEFAULT_CHROMATIC_SCALE_CONVENTION;

    // Visualization.
    this.playVizTooltip_ = new mdc.tooltip.MDCTooltip(document.getElementById('play-viz-tooltip'));
    this.pauseVizTooltip_ = new mdc.tooltip.MDCTooltip(document.getElementById('pause-viz-tooltip'));
    
    // Instrument selection.
    this.instrumentMenuElement_ = document.getElementById('instrument-menu');
    this.instrumentMenuNameElement_ = document.getElementById('instrument-menu-name');
    this.instrumentMenuNameElement_.innerHTML = DEFAULT_INSTRUMENT;
    this.createInstrumentMenu();
    
    // Input MIDI device selection.
    this.MidiDeviceMenuElement_ = document.getElementById('midi-device-menu');
    this.MidiDeviceMenuNameElement_ = document.getElementById('midi-device-menu-name');

    // MIDI parser.
    const midiInput_ = document.getElementById('midi-file-input');
    MidiParser.parse(midiInput_, (midi) => this.loadMidi(midi));
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

  createInstrumentMenu() {
    let menuString = `<ul class="mdc-list" role="menu" aria-hidden="true"
                          aria-orientation="vertical" tabindex="-1">`;
    for (const instrument of this.soundPlayer_.getInstrumentList()) {
      menuString += `<li class="mdc-list-item" role="menuitem"
                         onclick="app.selectInstrument(event, '${instrument}')">
                      <span class="mdc-list-item__ripple"></span>
                      <span class="mdc-list-item__text">${instrument}</span>
                    </li>`
    }
    menuString += `</ul>`;
    this.instrumentMenuElement_.innerHTML = menuString;
    this.instrumentMenu_ = new mdc.menu.MDCMenu(this.instrumentMenuElement_);
  }

  selectInstrument(event, instrument) {
    event.stopPropagation();
    this.soundPlayer_.selectInstrument(instrument);
    this.instrumentMenuNameElement_.innerHTML = instrument;
    this.instrumentMenu_.open = false;
  }

  openInstrumentMenu() {
    this.instrumentMenu_.open = true;
  }

  async createMidiDeviceMenu() {
    let menuString = `<ul class="mdc-list" role="menu" aria-hidden="true"
                          aria-orientation="vertical" tabindex="-1">`;
    const access = await navigator.requestMIDIAccess();
    const inputs = access.inputs;
    for (const input of inputs.values()) {
      menuString += `<li class="mdc-list-item" role="menuitem"
                         onclick="app.selectMidiDevice(event, '${input.id}', '${input.name}')">
                      <span class="mdc-list-item__ripple"></span>
                      <span class="mdc-list-item__text">${input.name}</span>
                    </li>`
    }
    menuString += `</ul>`;
    this.MidiDeviceMenuElement_.innerHTML = menuString;
    this.MidiDeviceMenu_ = new mdc.menu.MDCMenu(this.MidiDeviceMenuElement_);
  }

  async selectMidiDevice(event, deviceId, deviceName) {
    event.stopPropagation();
    const access = await navigator.requestMIDIAccess();
    const inputs = access.inputs;
    for (const input of inputs.values()) {
      if (input.id === deviceId) {
        this.initMidi(input);
      }
    }
    this.MidiDeviceMenuNameElement_.innerHTML = deviceName;
    this.MidiDeviceMenu_.open = false;
  }

  async openMidiDeviceMenu() {
    await this.createMidiDeviceMenu();
    this.MidiDeviceMenu_.open = true;
  }

  loadMidi(midi) {
    console.log(midi);
    const tickPerQuarter = midi.timeDivision;
    let msPerQuarter = 500;
    for (let e of midi.track[0].event) {
      if (e.type === 255 && e.metaType === 81) {
        msPerQuarter = e.data / 1000;
      }
    }
    this.midiTicksPerMs_ = tickPerQuarter / msPerQuarter;
    this.midiCurrentEventIndex_ = 0;
    this.midiEvents_ = midi.track[0].event;
    this.midiPlaying_ = false;
    this.midiTicksPlayed_ = 0;
    this.midiStartTimeMs_ = null;
    this.midiTickCount_ = 0;
    // TODO(remove).
    this.startMidi();
  }

  startMidi() {
    this.midiStartTimeMs_ = Date.now();
    this.midiPlaying_ = true;
    this.midiTimePlayedMs_ = 0;
    this.midiCurrentEventIndex_ = 0;
    this.midiTickCount_ = 0;
    this.refreshMidi();
  }

  pauseMidi() {
    this.midiTimePlayedMs_ = Date.now() - this.midiStartTimeMs_;
    this.midiPlaying_ = false;
  }

  refreshMidi() {
    if (!this.midiPlaying_) {
      return;
    }
    requestAnimationFrame(() => this.refreshMidi());
    const currentTimeMs = Date.now() - this.midiStartTimeMs_;
    while (this.midiCurrentEventIndex_ < this.midiEvents_.length) {
      const e = this.midiEvents_[this.midiCurrentEventIndex_];
      const ticks = this.midiTickCount_ + e.deltaTime;
      const playTimeMs = ticks / this.midiTicksPerMs_;
      console.log(`${playTimeMs} - ${currentTimeMs}`);
      if (playTimeMs > currentTimeMs) {
        break;
      }
      this.midiTickCount_ += e.deltaTime;
      this.midiCurrentEventIndex_ += 1;
      if (e.type !== 8 && e.type !== 9) {
        continue;
      }
      console.log(e.data);
      if (e.type === 9 & e.data[1] !== 0) {
        this.noteOn(e.data[0]);
      } else {
        this.noteOff(e.data[0]);
      }
    }
  }
}

let app;
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
  app = new App();
});
