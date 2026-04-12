import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { FindUserProvider } from './find-user.provider';
import { CreateUserProvider } from './create-user.provider';
import { UpdateUserProvider } from './update-user.provider';
import { HashingProvider } from '../../auth/providers/hashing.provider';

/**
 * Fasadni servis za upravljanje korisnicima.
 *
 * Pruža sučelje za UsersController delegirajući operacije
 * specijaliziranim providerima. Pokriva funkcionalne zahtjeve:
 * - FZ-U03: Pregled i ažuriranje profila
 * - FZ-U04: Promjena lozinke
 * - CRUD po ID-u za admin pristup putem Swaggera
 */
@Injectable()
export class UsersService {
  constructor(
    /** TypeORM repozitorij za direktne operacije (delete, update) */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    /** Provider za pronalaženje korisnika */
    private readonly findUserProvider: FindUserProvider,
    /** Provider za kreiranje korisnika */
    private readonly createUserProvider: CreateUserProvider,
    /** Provider za ažuriranje profila */
    private readonly updateUserProvider: UpdateUserProvider,
    /** Provider za hashiranje i usporedbu lozinki */
    private readonly hashingProvider: HashingProvider,
  ) {}

  /**
   * Kreira novog korisnika — delegira na CreateUserProvider.
   *
   * @param createUserDto - Podaci za kreiranje korisnika
   * @returns Kreirani User entitet
   */
  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.createUserProvider.createUser(createUserDto);
  }

  /**
   * Dohvaća profil korisnika po ID-u.
   *
   * @param id - UUID korisnika (iz JWT payloada ili URL parametra)
   * @returns User entitet (bez passwordHash zahvaljujući @Exclude)
   * @throws NotFoundException — ako korisnik ne postoji
   */
  public async getProfile(id: string): Promise<User> {
    // Pronalaženje korisnika po ID-u
    const user = await this.findUserProvider.findOneById(id);

    if (!user) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    return user;
  }

  /**
   * Ažurira korisnički profil — delegira na UpdateUserProvider.
   *
   * @param updateUserDto - Polja za ažuriranje
   * @param id - UUID korisnika
   * @returns Ažurirani User entitet
   */
  public async updateUser(
    updateUserDto: UpdateUserDto,
    id: string,
  ): Promise<User> {
    return this.updateUserProvider.updateUser(updateUserDto, id);
  }

  /**
   * Briše korisnički račun iz baze podataka.
   *
   * @param id - UUID korisnika za brisanje
   * @returns Objekt s oznakom uspješnosti i ID-em obrisanog korisnika
   */
  public async removeUser(
    id: string,
  ): Promise<{ deleted: boolean; id: string }> {
    // Brisanje korisnika iz baze — affected > 0 znači da je brisanje uspjelo
    const result = await this.usersRepository.delete(id);
    return { deleted: (result.affected ?? 0) > 0, id };
  }

  /**
   * Promjena lozinke korisnika (FZ-U04).
   *
   * Flow:
   * 1. Pronađi korisnika po ID-u
   * 2. Verificiraj trenutnu lozinku
   * 3. Hashiraj novu lozinku
   * 4. Spremi novu hashiranu lozinku u bazu
   *
   * @param userId - UUID korisnika (iz JWT payloada)
   * @param changePasswordDto - Trenutna i nova lozinka
   * @returns Poruka o uspješnoj promjeni
   * @throws NotFoundException — ako korisnik ne postoji
   * @throws UnauthorizedException — ako je trenutna lozinka neispravna
   */
  public async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Dohvaćanje korisnika iz baze
    const user = await this.findUserProvider.findOneById(userId);

    if (!user) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    // Verifikacija trenutne lozinke — usporedba s hashom u bazi
    const isPasswordValid = await this.hashingProvider.comparePassword(
      changePasswordDto.oldPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Trenutna lozinka nije ispravna');
    }

    // Hashiranje nove lozinke
    const hashedNewPassword = await this.hashingProvider.hashPassword(
      changePasswordDto.newPassword,
    );

    // Spremanje nove hashirane lozinke u bazu
    await this.usersRepository.update(userId, {
      passwordHash: hashedNewPassword,
    });

    return { message: 'Lozinka uspješno promijenjena' };
  }
}
