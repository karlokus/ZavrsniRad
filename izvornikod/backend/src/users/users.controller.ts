import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './providers/users.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

/**
 * Kontroler za upravljanje korisničkim profilom.
 *
 * Svi endpointi zahtijevaju JWT autentikaciju (globalni AuthenticationGuard).
 * Korisnik pristupa isključivo vlastitim podacima putem /me endpointa —
 * user ID se uvijek čita iz JWT payloada, nikad iz URL-a ili tijela zahtjeva.
 *
 * Endpointi:
 * - GET /users/me — dohvat profila (FZ-U03)
 * - PATCH /users/me — ažuriranje profila (FZ-U03)
 * - DELETE /users/me — brisanje računa
 * - PATCH /users/change-password — promjena lozinke (FZ-U04)
 */
@ApiTags('Users')
@ApiBearerAuth('access-token') // Prikazuje "Authorize" gumb u Swagger UI-u
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Dohvat profila trenutno prijavljenog korisnika (FZ-U03).
   * @param userId - UUID korisnika iz JWT payloada
   * @returns User entitet (bez passwordHash)
   */
  @Get('me')
  @ApiOperation({ summary: 'Dohvat profila trenutno prijavljenog korisnika' })
  @ApiResponse({ status: 200, description: 'Profil korisnika' })
  @ApiResponse({ status: 404, description: 'Korisnik nije pronađen' })
  public getProfile(@UserPayload('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  /**
   * Ažuriranje profila trenutno prijavljenog korisnika (FZ-U03).
   *
   * Dozvoljena polja za ažuriranje: firstName, lastName, instrumentId, skillLevel.
   * Email i lozinka se ne mogu promijeniti ovim endpointom.
   *
   * @param userId - UUID korisnika iz JWT payloada
   * @param updateUserDto - Polja za ažuriranje (sva opcionalna)
   * @returns Ažurirani User entitet
   */
  @Patch('me')
  @ApiOperation({ summary: 'Ažuriranje profila trenutno prijavljenog korisnika' })
  @ApiResponse({ status: 200, description: 'Profil ažuriran' })
  @ApiResponse({ status: 404, description: 'Korisnik nije pronađen' })
  public updateProfile(
    @UserPayload('sub') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(updateUserDto, userId);
  }

  /**
   * Brisanje profila trenutno prijavljenog korisnika.
   * @param userId - UUID korisnika iz JWT payloada
   * @returns Objekt s oznakom uspješnosti i ID-em
   */
  @Delete('me')
  @ApiOperation({ summary: 'Brisanje profila trenutno prijavljenog korisnika' })
  @ApiResponse({ status: 200, description: 'Profil obrisan' })
  public removeProfile(@UserPayload('sub') userId: string) {
    return this.usersService.removeUser(userId);
  }

  /**
   * Promjena lozinke trenutno prijavljenog korisnika (FZ-U04).
   *
   * Korisnik mora poslati trenutnu lozinku za verifikaciju
   * i novu lozinku koja mora zadovoljiti sigurnosne zahtjeve.
   *
   * @param userId - UUID korisnika iz JWT payloada
   * @param changePasswordDto - Trenutna i nova lozinka
   * @returns Poruka o uspješnoj promjeni
   */
  @Patch('change-password')
  @ApiOperation({ summary: 'Promjena lozinke trenutno prijavljenog korisnika' })
  @ApiResponse({ status: 200, description: 'Lozinka uspješno promijenjena' })
  @ApiResponse({ status: 401, description: 'Trenutna lozinka nije ispravna' })
  @ApiResponse({ status: 404, description: 'Korisnik nije pronađen' })
  public changePassword(
    @UserPayload('sub') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, changePasswordDto);
  }
}
