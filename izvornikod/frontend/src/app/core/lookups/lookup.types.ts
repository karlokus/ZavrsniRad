export interface Instrument {
  id: string;
  instrumentName: string;
}

export interface Artist {
  id: string;
  name: string;
}

export interface KeySignature {
  id: string;
  name: string;
  type: 'MAJOR' | 'MINOR';
  rootNote: string;
}
