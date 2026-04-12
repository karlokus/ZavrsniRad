/**
 * Tipovi kompozicija u sustavu.
 *
 * - SONG — pjesma u korisnikovom repertoaru (user-owned)
 * - EXERCISE — generirana vježba (read-only, bez vlasnika)
 */
export enum CompositionType {
  SONG = 'SONG',
  EXERCISE = 'EXERCISE',
}
