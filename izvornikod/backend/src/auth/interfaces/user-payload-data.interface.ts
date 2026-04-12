/**
 * Struktura podataka JWT payloada koji se sprema na request objekt.
 *
 * Ovi podaci se kodiraju u access token prilikom generiranja
 * (GenerateTokensProvider) i dekodiraju prilikom verifikacije
 * (AccessTokenGuard). Dostupni su u kontrolerima putem @UserPayload() dekoratora.
 */
export interface UserPayloadData {
  /** UUID korisnika — koristi se za identifikaciju u svim /me endpointima */
  sub: string;
  /** Email korisnika — ugrađen u token za brzi pristup bez upita u bazu */
  email: string;
  /** Označava je li korisnički račun blokiran — AccessTokenGuard odbija blokirane korisnike */
  isBlocked: boolean;
}
