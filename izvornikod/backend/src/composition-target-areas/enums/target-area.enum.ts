/**
 * Aspekt sviranja koji se trenira na kompoziciji.
 *
 * Koristi se u CompositionTargetArea entitetu za označavanje
 * kojih konkretnih izvedbenih vještina se kompozicija dotiče.
 * Sustav za preporuku vježbi (Faza 8) koristi ove oznake za
 * uparivanje korisnikovih slabih područja s odgovarajućim vježbama.
 *
 * Vrijednosti:
 * - NOTE_ACCURACY  — preciznost pogađanja nota
 * - RHYTHM         — ritmička točnost
 * - TEMPO          — održavanje tempa
 * - FINGER_DEXTERITY — spretnost prstiju
 * - SCALE          — sviranje ljestvica
 * - CHORD          — sviranje akorda
 */
export enum TargetArea {
  NOTE_ACCURACY = 'NOTE_ACCURACY',
  RHYTHM = 'RHYTHM',
  TEMPO = 'TEMPO',
  FINGER_DEXTERITY = 'FINGER_DEXTERITY',
  SCALE = 'SCALE',
  CHORD = 'CHORD',
}
