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
import { CompositionsService } from './providers/compositions.service';
import { CreateCompositionDto } from './dtos/create-composition.dto';
import { UpdateCompositionDto } from './dtos/update-composition.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

/**
 * Kontroler za upravljanje kompozicijama (SONG).
 *
 * Sve rute zahtijevaju JWT autentikaciju (default Bearer guard).
 * userId se uvijek čita iz JWT payloada (@UserPayload('sub')).
 *
 * EXERCISE kompozicije se NE kreiraju preko API-ja — POST endpoint
 * kreira isključivo SONG tip.
 *
 * Vlasništvo:
 * - SONG: samo vlasnik može vidjeti, ažurirati i brisati
 * - EXERCISE: svi autenticirani korisnici mogu čitati (GET)
 *
 * Endpointi:
 * - POST /compositions — kreiranje nove SONG kompozicije
 * - GET /compositions — lista svih dostupnih kompozicija
 * - GET /compositions/:id — dohvat kompozicije po ID-u
 * - PATCH /compositions/:id — ažuriranje kompozicije
 * - DELETE /compositions/:id — brisanje kompozicije
 */
@ApiTags('Compositions')
@ApiBearerAuth('access-token')
@Controller('compositions')
export class CompositionsController {
  constructor(
    private readonly compositionsService: CompositionsService,
  ) {}

  /**
   * Kreiranje nove SONG kompozicije.
   *
   * Type je automatski postavljen na SONG — EXERCISE se ne kreira
   * preko API-ja. userId se postavlja iz JWT payloada.
   *
   * @param userId - UUID korisnika iz JWT-a
   * @param createCompositionDto - Podaci za kreiranje kompozicije
   * @returns Kreirana Composition entitet
   */
  @Post()
  @ApiOperation({ summary: 'Kreiranje nove kompozicije (SONG)' })
  @ApiResponse({ status: 201, description: 'Kompozicija uspješno kreirana' })
  @ApiResponse({
    status: 404,
    description: 'Izvođač ili tonalitet ne postoji',
  })
  public createComposition(
    @UserPayload('sub') userId: string,
    @Body() createCompositionDto: CreateCompositionDto,
  ) {
    return this.compositionsService.createComposition(
      createCompositionDto,
      userId,
    );
  }

  /**
   * Dohvaćanje svih kompozicija dostupnih korisniku.
   *
   * Vraća sve SONG kompozicije čiji je vlasnik aktivni korisnik
   * te sve EXERCISE kompozicije (dostupne svim korisnicima).
   *
   * @param userId - UUID korisnika iz JWT-a
   * @returns Lista kompozicija sortirana po naslovu (A-Z)
   */
  @Get()
  @ApiOperation({ summary: 'Dohvat svih kompozicija korisnika + vježbi' })
  @ApiResponse({ status: 200, description: 'Lista kompozicija' })
  public findAll(@UserPayload('sub') userId: string) {
    return this.compositionsService.findAll(userId);
  }

  /**
   * Dohvaćanje kompozicije po UUID-u.
   *
   * SONG kompozicije su dostupne samo vlasniku.
   * EXERCISE kompozicije su dostupne svim autenticiranim korisnicima.
   *
   * @param id - UUID kompozicije iz URL parametra
   * @param userId - UUID korisnika iz JWT-a
   * @returns Composition entitet s relacijama
   */
  @Get(':id')
  @ApiOperation({ summary: 'Dohvat kompozicije po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID kompozicije', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Kompozicija pronađena' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kompoziciji' })
  @ApiResponse({ status: 404, description: 'Kompozicija nije pronađena' })
  public getCompositionById(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.compositionsService.getCompositionById(id, userId);
  }

  /**
   * Ažuriranje kompozicije po UUID-u.
   *
   * Samo vlasnik može ažurirati SONG kompoziciju.
   * Ažuriraju se samo proslijeđena polja — ostala zadržavaju vrijednost.
   *
   * @param id - UUID kompozicije iz URL parametra
   * @param userId - UUID korisnika iz JWT-a
   * @param updateCompositionDto - Polja za ažuriranje
   * @returns Ažurirani Composition entitet
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje kompozicije po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID kompozicije', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Kompozicija ažurirana' })
  @ApiResponse({ status: 400, description: 'Kompozicija ne postoji' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kompoziciji' })
  @ApiResponse({
    status: 404,
    description: 'Izvođač ili tonalitet ne postoji',
  })
  public updateComposition(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
    @Body() updateCompositionDto: UpdateCompositionDto,
  ) {
    return this.compositionsService.updateComposition(
      updateCompositionDto,
      id,
      userId,
    );
  }

  /**
   * Brisanje kompozicije po UUID-u.
   *
   * Samo vlasnik može obrisati svoju SONG kompoziciju.
   *
   * @param id - UUID kompozicije iz URL parametra
   * @param userId - UUID korisnika iz JWT-a
   * @returns Objekt s oznakom uspješnosti i ID-em obrisane kompozicije
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje kompozicije po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID kompozicije', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Kompozicija obrisana' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kompoziciji' })
  @ApiResponse({ status: 404, description: 'Kompozicija nije pronađena' })
  public deleteComposition(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.compositionsService.removeComposition(id, userId);
  }
}
