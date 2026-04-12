import { Injectable } from '@nestjs/common';
import { HashingProvider } from './hashing.provider';
import * as bcrypt from 'bcrypt';

/**
 * Bcrypt implementacija HashingProvider-a.
 *
 * Koristi bcrypt algoritam za hashiranje i usporedbu lozinki.
 * Automatski generira salt prije hashiranja za dodatnu sigurnost.
 * Registrira se u AuthModule kao konkretna implementacija apstraktnog HashingProvider-a.
 */
@Injectable()
export class BcryptProvider implements HashingProvider {
  /**
   * Hashira lozinku koristeći bcrypt s automatski generiranim saltom.
   * @param data - Lozinka u čistom tekstu
   * @returns Hashirana lozinka (uključuje salt u rezultatu)
   */
  public async hashPassword(data: string | Buffer): Promise<string> {
    // Generiranje random salta za bcrypt
    const salt = await bcrypt.genSalt();
    // Hashiranje lozinke sa saltom
    return bcrypt.hash(data, salt);
  }

  /**
   * Uspoređuje lozinku u čistom tekstu s bcrypt hashom.
   * @param data - Lozinka u čistom tekstu
   * @param encrypted - Bcrypt hash pohranjen u bazi
   * @returns true ako se lozinke podudaraju
   */
  public comparePassword(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
