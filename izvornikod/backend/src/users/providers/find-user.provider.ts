import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * Provider za pronalaženje korisnika u bazi podataka.
 *
 * Koristi se u:
 * - SignInProvider — pronalaženje po emailu za prijavu
 * - RefreshTokensProvider — pronalaženje po ID-u za obnovu tokena
 * - UsersService — dohvaćanje profila
 * - CreateUserProvider — provjera duplikata emaila
 * - UpdateUserProvider — dohvaćanje korisnika prije ažuriranja
 */
@Injectable()
export class FindUserProvider {
  constructor(
    /** TypeORM repozitorij za User entitet */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Pronalazi korisnika po UUID-u.
   * @param id - UUID korisnika
   * @returns User entitet ili null ako ne postoji
   */
  public async findOneById(id: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ id });
  }

  /**
   * Pronalazi korisnika po email adresi.
   *
   * Koristi se za prijavu (sign-in) i provjeru duplikata pri registraciji.
   * Ako dođe do greške pri upitu u bazu, baca RequestTimeoutException.
   *
   * @param email - Email adresa korisnika
   * @returns User entitet ili null ako ne postoji
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async findOneByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOneBy({ email });
    } catch (error) {
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
