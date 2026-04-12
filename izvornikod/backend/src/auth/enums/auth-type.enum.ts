/**
 * Tipovi autentikacije za @Auth() dekorator.
 *
 * Koristi se za označavanje ruta koje zahtijevaju ili ne zahtijevaju
 * JWT autentikaciju. AuthenticationGuard čita ovu vrijednost iz metapodataka
 * i delegira na odgovarajući guard.
 */
export enum AuthType {
  /** Zahtijeva valjan JWT access token (default za sve rute) */
  Bearer,
  /** Javna ruta — ne zahtijeva autentikaciju */
  None,
}
