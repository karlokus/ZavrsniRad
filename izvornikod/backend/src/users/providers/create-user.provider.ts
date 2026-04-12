import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { User } from '../entities/user.entity';
import { FindUserProvider } from './find-user.provider';
import { HashingProvider } from '../../auth/providers/hashing.provider';

/**
 * Provider za kreiranje novog korisnika u bazi podataka.
 *
 * Koristi se prilikom registracije (AuthService.signUp).
 * Provjerava duplikat emaila, hashira lozinku i sprema korisnika.
 * Koristi forwardRef za HashingProvider zbog cirkularne ovisnosti Auth ↔ Users.
 */
@Injectable()
export class CreateUserProvider {
  constructor(
    /** Provider za provjeru postoji li korisnik s istim emailom */
    private readonly findUserProvider: FindUserProvider,

    /** TypeORM repozitorij za User entitet */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    /** Provider za hashiranje lozinke — forwardRef zbog cirkularne ovisnosti */
    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,
  ) {}

  /**
   * Kreira novog korisnika u bazi podataka.
   *
   * Flow:
   * 1. Provjera postoji li korisnik s istim emailom
   * 2. Hashiranje lozinke putem BcryptProvider-a
   * 3. Kreiranje User entiteta s hashiranom lozinkom
   * 4. Spremanje u bazu s error handling-om za duplikat emaila
   *
   * @param createUserDto - Podaci za registraciju (ime, prezime, email, lozinka, instrument?, razina?)
   * @returns Kreirani User entitet
   * @throws BadRequestException — ako korisnik s istim emailom već postoji
   * @throws ConflictException — ako dođe do unique constraint greške na bazi razini
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Provjera postoji li korisnik s istim emailom
    const existing = await this.findUserProvider.findOneByEmail(
      createUserDto.email,
    );

    if (existing) {
      throw new BadRequestException(
        'User already exists, please check your email.',
      );
    }

    // Kreiranje User entiteta s hashiranom lozinkom i opcionalnim instrumentom
    const newUser = this.usersRepository.create({
      ...createUserDto,
      passwordHash: await this.hashingProvider.hashPassword(
        createUserDto.password,
      ),
      // Ako je instrumentId poslan, kreira se relacija samo s ID-em (bez dohvaćanja iz baze)
      instrument: createUserDto.instrumentId
        ? { id: createUserDto.instrumentId }
        : undefined,
    });

    try {
      // Spremanje korisnika u bazu
      return await this.usersRepository.save(newUser);
    } catch (error: unknown) {
      // Hvatanje PostgreSQL unique constraint greške za email
      if (error instanceof Error && 'detail' in error) {
        const detail = (error as { detail: string }).detail;
        if (detail.includes('email')) {
          throw new ConflictException('Email must be unique');
        }
      }
      // Sve ostale greške → generička poruka
      const errMessage = (error as Error).message;
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description:
            'Error connecting to the database, error message: ' + errMessage,
        },
      );
    }
  }
}
