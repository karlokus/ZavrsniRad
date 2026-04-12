/**
 * Razina sviranja korisnika.
 *
 * Koristi se u User entitetu (skill_level kolona) i u CreateUserDto
 * za validaciju prilikom registracije ili ažuriranja profila.
 * Definirano prema specifikaciji (sekcija 3.1).
 */
export enum SkillLevel {
  /** Početnik */
  BEGINNER = 'BEGINNER',
  /** Srednja razina */
  INTERMEDIATE = 'INTERMEDIATE',
  /** Napredna razina */
  ADVANCED = 'ADVANCED',
}
