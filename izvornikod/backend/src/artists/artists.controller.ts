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
import { ArtistsService } from './providers/artists.service';
import { CreateArtistDto } from './dtos/create-artist.dto';
import { UpdateArtistDto } from './dtos/update-artist.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

/**
 * Kontroler za upravljanje katalogom izvođača.
 *
 * Shared katalog — svi korisnici dijele iste izvođače.
 *
 * Javni endpointi (bez JWT autentikacije):
 * - GET /artists — lista svih izvođača
 * - GET /artists/:id — dohvat izvođača po ID-u
 *
 * Zaštićeni endpointi (zahtijevaju JWT):
 * - POST /artists — kreiranje novog izvođača
 * - PATCH /artists/:id — ažuriranje izvođača
 * - DELETE /artists/:id — brisanje izvođača
 */
@ApiTags('Artists')
@ApiBearerAuth('access-token') // Prikazuje "Authorize" gumb u Swagger UI-u
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  // ────────────────────────────────────────────
  //  Javni endpointi — dostupni bez JWT autentikacije
  // ────────────────────────────────────────────

  /**
   * Dohvaćanje svih izvođača iz kataloga — JAVNA RUTA.
   *
   * Koristi se na frontend-u za prikaz liste izvođača
   * pri kreiranju i ažuriranju kompozicije.
   *
   * @returns Lista svih izvođača sortirano po nazivu (A-Z)
   */
  @Get()
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Dohvat svih izvođača (javno)' })
  @ApiResponse({ status: 200, description: 'Lista izvođača' })
  public findAll() {
    return this.artistsService.findAll();
  }

  /**
   * Dohvaćanje izvođača po UUID-u — JAVNA RUTA.
   *
   * @param id - UUID izvođača iz URL parametra
   * @returns Artist entitet
   */
  @Get(':id')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Dohvat izvođača po ID-u (javno)' })
  @ApiParam({ name: 'id', description: 'UUID izvođača', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Izvođač pronađen' })
  @ApiResponse({ status: 404, description: 'Izvođač nije pronađen' })
  public getArtistById(@Param('id', ParseUUIDPipe) id: string) {
    return this.artistsService.getArtistById(id);
  }

  // ────────────────────────────────────────────
  //  Zaštićeni endpointi — zahtijevaju JWT autentikaciju
  // ────────────────────────────────────────────

  /**
   * Kreiranje novog izvođača u katalogu.
   *
   * Zahtijeva JWT autentikaciju (default Bearer guard).
   *
   * @param createArtistDto - Podaci za kreiranje izvođača
   * @returns Kreirani Artist entitet
   */
  @Post()
  @ApiOperation({ summary: 'Kreiranje novog izvođača' })
  @ApiResponse({ status: 201, description: 'Izvođač uspješno kreiran' })
  @ApiResponse({
    status: 409,
    description: 'Izvođač s tim nazivom već postoji',
  })
  public createArtist(@Body() createArtistDto: CreateArtistDto) {
    return this.artistsService.createArtist(createArtistDto);
  }

  /**
   * Ažuriranje izvođača po UUID-u.
   *
   * Zahtijeva JWT autentikaciju (default Bearer guard).
   *
   * @param id - UUID izvođača iz URL parametra
   * @param updateArtistDto - Polja za ažuriranje (name?)
   * @returns Ažurirani Artist entitet
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje izvođača po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID izvođača', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Izvođač ažuriran' })
  @ApiResponse({ status: 400, description: 'Izvođač ne postoji' })
  @ApiResponse({
    status: 409,
    description: 'Izvođač s tim nazivom već postoji',
  })
  public updateArtist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArtistDto: UpdateArtistDto,
  ) {
    return this.artistsService.updateArtist(updateArtistDto, id);
  }

  /**
   * Brisanje izvođača iz kataloga po UUID-u.
   *
   * Zahtijeva JWT autentikaciju (default Bearer guard).
   *
   * @param id - UUID izvođača iz URL parametra
   * @returns Objekt s oznakom uspješnosti i ID-em obrisanog izvođača
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje izvođača po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID izvođača', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Izvođač obrisan' })
  public deleteArtist(@Param('id', ParseUUIDPipe) id: string) {
    return this.artistsService.removeArtist(id);
  }
}
