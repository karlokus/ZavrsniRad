/**
 * Aspekt naučenosti kompozicije čija se promjena bilježi (FZ-R15, FZ-R16, FZ-R17).
 *
 * Mapira se 1:1 na 3 mastery polja u Composition entitetu:
 * - NOTES   ↔ composition.notesMastery
 * - LYRICS  ↔ composition.lyricsMastery
 * - PLAYING ↔ composition.playingMastery
 *
 * Svaka promjena bilo kojeg od ovih polja generira jedan MasteryLog zapis,
 * što omogućuje crtanje krivulja napretka u dashboardu (FZ-D02).
 */
export enum MasteryAspect {
  NOTES = 'NOTES',
  LYRICS = 'LYRICS',
  PLAYING = 'PLAYING',
}
