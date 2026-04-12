import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './providers/users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

/**
 * Kontroler za upravljanje korisnicima.
 *
 * Svi endpointi zahtijevaju JWT autentikaciju (globalni AuthenticationGuard).
 *
 * /me endpointi — korisnik pristupa vlastitim podacima (ID iz JWT payloada):
 * - GET /users/me — dohvat profila (FZ-U03)
 * - PATCH /users/me — ažuriranje profila (FZ-U03)
 * - DELETE /users/me — brisanje računa
 * - PATCH /users/change-password — promjena lozinke (FZ-U04)
 *
 * CRUD po ID-u — pristup za upravljanje korisnicima putem Swaggera:
 * - POST /users — kreiranje korisnika
 * - GET /users/:id — dohvat korisnika po ID-u
 * - PATCH /users/:id — ažuriranje korisnika po ID-u
 * - DELETE /users/:id — brisanje korisnika po ID-u
 */
@ApiTags('Users')
@ApiBearerAuth('access-token') // Prikazuje "Authorize" gumb u Swagger UI-u
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ────────────────────────────────────────────
  //  /me endpointi — korisnik pristupa vlastitim podacima
  // ────────────────────────────────────────────

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

  // ────────────────────────────────────────────
  //  CRUD po ID-u — pristup putem Swaggera
  // ────────────────────────────────────────────

  /**
   * Kreiranje novog korisnika.
   *
   * Omogućuje kreiranje korisničkog računa s kompletnim podacima.
   * Lozinka se hashira prije spremanja u bazu.
   *
   * @param createUserDto - Podaci za kreiranje korisnika
   * @returns Kreirani User entitet
   */
  @Post()
  @ApiOperation({ summary: 'Kreiranje novog korisnika' })
  @ApiResponse({ status: 201, description: 'Korisnik uspješno kreiran' })
  @ApiResponse({ status: 400, description: 'Korisnik s tim emailom već postoji' })
  public createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  /**
   * Dohvat korisnika po UUID-u.
   *
   * @param id - UUID korisnika iz URL parametra
   * @returns User entitet (bez passwordHash)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Dohvat korisnika po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID korisnika', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Korisnik pronađen' })
  @ApiResponse({ status: 404, description: 'Korisnik nije pronađen' })
  public getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getProfile(id);
  }

  /**
   * Ažuriranje korisnika po UUID-u.
   *
   * Dozvoljena polja za ažuriranje: firstName, lastName, instrumentId, skillLevel.
   *
   * @param id - UUID korisnika iz URL parametra
   * @param updateUserDto - Polja za ažuriranje (sva opcionalna)
   * @returns Ažurirani User entitet
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje korisnika po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID korisnika', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Korisnik ažuriran' })
  @ApiResponse({ status: 400, description: 'Korisnik ne postoji' })
  public updateUserById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(updateUserDto, id);
  }

  /**
   * Brisanje korisnika po UUID-u.
   *
   * @param id - UUID korisnika iz URL parametra
   * @returns Objekt s oznakom uspješnosti i ID-em obrisanog korisnika
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje korisnika po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID korisnika', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Korisnik obrisan' })
  public deleteUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.removeUser(id);
  }
}
