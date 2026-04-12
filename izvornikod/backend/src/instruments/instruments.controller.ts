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
import { InstrumentsService } from './providers/instruments.service';
import { CreateInstrumentDto } from './dtos/create-instrument.dto';
import { UpdateInstrumentDto } from './dtos/update-instrument.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

/**
 * Kontroler za upravljanje katalogom instrumenata.
 *
 * Javni endpointi (bez JWT autentikacije):
 * - GET /instruments — lista svih instrumenata (potrebna za registraciju)
 * - GET /instruments/:id — dohvat instrumenta po ID-u
 *
 * Zaštićeni endpointi (zahtijevaju JWT):
 * - POST /instruments — kreiranje novog instrumenta
 * - PATCH /instruments/:id — ažuriranje instrumenta
 * - DELETE /instruments/:id — brisanje instrumenta
 */
@ApiTags('Instruments')
@ApiBearerAuth('access-token') // Prikazuje "Authorize" gumb u Swagger UI-u
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  // ────────────────────────────────────────────
  //  Javni endpointi — dostupni bez JWT autentikacije
  // ────────────────────────────────────────────

  /**
   * Dohvaćanje svih instrumenata iz kataloga — JAVNA RUTA.
   *
   * Koristi se na frontend-u za prikaz liste instrumenata
   * pri registraciji i ažuriranju profila.
   *
   * @returns Lista svih instrumenata sortirano po nazivu (A-Z)
   */
  @Get()
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Dohvat svih instrumenata (javno)' })
  @ApiResponse({ status: 200, description: 'Lista instrumenata' })
  public findAll() {
    return this.instrumentsService.findAll();
  }

  /**
   * Dohvaćanje instrumenta po UUID-u — JAVNA RUTA.
   *
   * @param id - UUID instrumenta iz URL parametra
   * @returns Instrument entitet
   */
  @Get(':id')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Dohvat instrumenta po ID-u (javno)' })
  @ApiParam({ name: 'id', description: 'UUID instrumenta', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Instrument pronađen' })
  @ApiResponse({ status: 404, description: 'Instrument nije pronađen' })
  public getInstrumentById(@Param('id', ParseUUIDPipe) id: string) {
    return this.instrumentsService.getInstrumentById(id);
  }

  // ────────────────────────────────────────────
  //  Zaštićeni endpointi — zahtijevaju JWT autentikaciju
  // ────────────────────────────────────────────

  /**
   * Kreiranje novog instrumenta u katalogu.
   *
   * Zahtijeva JWT autentikaciju (default Bearer guard).
   *
   * @param createInstrumentDto - Podaci za kreiranje instrumenta
   * @returns Kreirani Instrument entitet
   */
  @Post()
  @ApiOperation({ summary: 'Kreiranje novog instrumenta' })
  @ApiResponse({ status: 201, description: 'Instrument uspješno kreiran' })
  @ApiResponse({
    status: 409,
    description: 'Instrument s tim nazivom već postoji',
  })
  public createInstrument(
    @Body() createInstrumentDto: CreateInstrumentDto,
  ) {
    return this.instrumentsService.createInstrument(createInstrumentDto);
  }

  /**
   * Ažuriranje instrumenta po UUID-u.
   *
   * Zahtijeva JWT autentikaciju (default Bearer guard).
   *
   * @param id - UUID instrumenta iz URL parametra
   * @param updateInstrumentDto - Polja za ažuriranje (instrumentName?)
   * @returns Ažurirani Instrument entitet
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje instrumenta po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID instrumenta', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Instrument ažuriran' })
  @ApiResponse({ status: 400, description: 'Instrument ne postoji' })
  @ApiResponse({
    status: 409,
    description: 'Instrument s tim nazivom već postoji',
  })
  public updateInstrument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInstrumentDto: UpdateInstrumentDto,
  ) {
    return this.instrumentsService.updateInstrument(updateInstrumentDto, id);
  }

  /**
   * Brisanje instrumenta iz kataloga po UUID-u.
   *
   * Zahtijeva JWT autentikaciju (default Bearer guard).
   *
   * @param id - UUID instrumenta iz URL parametra
   * @returns Objekt s oznakom uspješnosti i ID-em obrisanog instrumenta
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje instrumenta po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID instrumenta', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Instrument obrisan' })
  public deleteInstrument(@Param('id', ParseUUIDPipe) id: string) {
    return this.instrumentsService.removeInstrument(id);
  }
}
