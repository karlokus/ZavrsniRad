import { Injectable } from '@nestjs/common';

/**
 * Apstraktni provider za hashiranje lozinki.
 *
 * Definira sučelje koje implementiraju konkretni provideri (npr. BcryptProvider).
 * Koristi se kroz Dependency Injection — u AuthModule se registrira kao:
 * `{ provide: HashingProvider, useClass: BcryptProvider }`
 *
 * Ovo omogućuje laku zamjenu algoritma hashiranja bez promjene ostatka koda.
 */
@Injectable()
export abstract class HashingProvider {
  /**
   * Hashira lozinku u čistom tekstu.
   * @param data - Lozinka u čistom tekstu
   * @returns Hashirana lozinka
   */
  abstract hashPassword(data: string | Buffer): Promise<string>;

  /**
   * Uspoređuje lozinku u čistom tekstu s hashiranom verzijom.
   * @param data - Lozinka u čistom tekstu koju korisnik unosi
   * @param encrypted - Hashirana lozinka pohranjena u bazi
   * @returns true ako se lozinke podudaraju
   */
  abstract comparePassword(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean>;
}
