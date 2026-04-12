import {
  BadRequestException,
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { User } from '../entities/user.entity';
import { FindUserProvider } from './find-user.provider';

/**
 * Provider za ažuriranje korisničkog profila.
 *
 * Koristi se putem PATCH /users/me endpointa.
 * Ažurira samo polja koja su poslana u zahtjevu (partial update).
 * Email i lozinka se NE mogu promijeniti ovim providerom.
 */
@Injectable()
export class UpdateUserProvider {
  constructor(
    /** Provider za pronalaženje korisnika prije ažuriranja */
    private readonly findUserProvider: FindUserProvider,

    /** TypeORM repozitorij za User entitet */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Ažurira korisnički profil.
   *
   * Dohvaća korisnika iz baze, primjenjuje promjene iz DTO-a
   * i sprema ažurirani entitet. Koristi nullish coalescing (??)
   * za zadržavanje postojeće vrijednosti ako polje nije poslano.
   *
   * @param updateUserDto - Polja za ažuriranje (firstName?, lastName?, skillLevel?, instrumentId?)
   * @param id - UUID korisnika čiji se profil ažurira
   * @returns Ažurirani User entitet
   * @throws BadRequestException — ako korisnik ne postoji
   * @throws ConflictException — ako ažuriranje uzrokuje duplikat emaila
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async updateUser(
    updateUserDto: UpdateUserDto,
    id: string,
  ): Promise<User> {
    // Dohvaćanje trenutnog korisnika iz baze
    const user = await this.findUserProvider.findOneById(id);

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    // Ažuriranje polja — zadržava postojeću vrijednost ako polje nije poslano
    user.firstName = updateUserDto.firstName ?? user.firstName;
    user.lastName = updateUserDto.lastName ?? user.lastName;
    user.skillLevel = updateUserDto.skillLevel ?? user.skillLevel;

    // Ažuriranje instrumenta — undefined znači "ne mijenjaj", null znači "ukloni"
    if (updateUserDto.instrumentId !== undefined) {
      user.instrument = updateUserDto.instrumentId
        ? ({ id: updateUserDto.instrumentId } as any)
        : (null as any);
    }

    try {
      // Spremanje ažuriranog korisnika u bazu
      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      // Hvatanje PostgreSQL unique constraint greške za email
      if (error instanceof Error && 'detail' in error) {
        const detail = (error as { detail: string }).detail;
        if (detail.includes('email')) {
          throw new ConflictException('Email must be unique');
        }
      }
      // Sve ostale greške → generička poruka
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        { description: 'Error connecting to the database' },
      );
    }
  }
}
