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
    console.log(`Note ${note} played.`);
  }

  /**
   * @param {number} note
   */
  noteOff(note) {
    console.log(`Note ${note} released.`);
  }
}

const app = new App();

function startApp() {
  app.start();
}
