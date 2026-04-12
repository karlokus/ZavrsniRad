/**
 * Enum za tip tonaliteta prema specifikaciji (sekcija 3.3.1).
 *
 * Definira je li tonalitet durski (MAJOR) ili molski (MINOR).
 * Koristi se u KeySignature entitetu i CreateKeySignatureDto-u.
 */
export enum KeySignatureType {
  /** Durski tonalitet (npr. C dur, G dur) */
  MAJOR = 'MAJOR',
  /** Molski tonalitet (npr. a mol, e mol) */
  MINOR = 'MINOR',
}
