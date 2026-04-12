import {
  forwardRef,
  Inject,
  Injectable,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from '../dtos/sign-in.dto';
import { FindUserProvider } from '../../users/providers/find-user.provider';
import { HashingProvider } from './hashing.provider';
import { GenerateTokensProvider } from './generate-tokens.provider';

/**
 * Provider za prijavu korisnika (sign-in).
 *
 * Implementira flow: email → pronađi usera → usporedi lozinku → generiraj tokene.
 * Koristi forwardRef za FindUserProvider zbog cirkularne ovisnosti Auth ↔ Users.
 */
@Injectable()
export class SignInProvider {
  constructor(
    /** Provider za pronalaženje korisnika — forwardRef zbog cirkularne ovisnosti */
    @Inject(forwardRef(() => FindUserProvider))
    private readonly findUserProvider: FindUserProvider,

    /** Provider za hashiranje i usporedbu lozinki */
    private readonly hashingProvider: HashingProvider,

    /** Provider za generiranje JWT tokena */
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  /**
   * Autentificira korisnika i vraća JWT tokene.
   *
   * @param signInDto - Email i lozinka za prijavu
   * @returns Objekt s accessToken i refreshToken
   * @throws UnauthorizedException — ako korisnik ne postoji ili je lozinka neispravna
   * @throws RequestTimeoutException — ako dođe do greške pri usporedbi lozinki
   */
  public async signIn(signInDto: SignInDto) {
    // Pronalaženje korisnika po email adresi
    const user = await this.findUserProvider.findOneByEmail(signInDto.email);

    // Korisnik s ovim emailom ne postoji
    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    let isEqual = false;

    try {
      // Provjera ima li korisnik postavljenu lozinku
      if (!user.passwordHash) {
        throw new UnauthorizedException('Password not set');
      }

      // Usporedba unesene lozinke s hashiranom verzijom iz baze
      isEqual = await this.hashingProvider.comparePassword(
        signInDto.password,
        user.passwordHash,
      );
    } catch (error) {
      // UnauthorizedException se propagira direktno
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Ostale greške (npr. problem s bcrypt bibliotekom) → timeout
      throw new RequestTimeoutException(error, {
        description: 'Could not compare passwords',
      });
    }

    // Lozinka se ne podudara
    if (!isEqual) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    // Generiranje i vraćanje access + refresh tokena
    return await this.generateTokensProvider.generateTokens(user);
  }
}
