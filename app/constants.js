// Source: https://en.wikipedia.org/wiki/Musical_note
const NOTE_NAMES = new Map();
NOTE_NAMES.set('english', ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);

// Source: https://www.projectrhea.org/rhea/index.php/Fourier_analysis_in_Music.
const INSTRUMENTS = new Map();
INSTRUMENTS.set('piano', [1, 0.1, 0.33, 0.06, 0.05, 0.04, 0, 0.01]);
INSTRUMENTS.set('guitar', [0.76, 0.52, 0.97, 0.09, 0.09, 0.08, 0, 0, 0.14, 0.05]);
INSTRUMENTS.set('flute', [0.11, 1, 0.4, 0.19, 0.02, 0.01]);
INSTRUMENTS.set('oboe', [0.48, 0.46, 1, 0.09, 0.1, 0.11, 0.24, 0.13, 0.1]);
