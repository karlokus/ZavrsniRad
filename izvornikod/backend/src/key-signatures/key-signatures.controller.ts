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
import { KeySignaturesService } from './providers/key-signatures.service';
import { CreateKeySignatureDto } from './dtos/create-key-signature.dto';
import { UpdateKeySignatureDto } from './dtos/update-key-signature.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

/**
 * Kontroler za upravljanje katalogom tonaliteta.
 *
 * Shared katalog — svi korisnici dijele iste tonalitete.
 * Seeded na startup s 30 standardnih tonaliteta (15 dur + 15 mol).
 *
 * Javni endpointi (bez JWT autentikacije):
 * - GET /key-signatures — lista svih tonaliteta
 * - GET /key-signatures/:id — dohvat tonaliteta po ID-u
 *
 * Zaštićeni endpointi (zahtijevaju JWT):
 * - POST /key-signatures — kreiranje novog tonaliteta
 * - PATCH /key-signatures/:id — ažuriranje tonaliteta
 * - DELETE /key-signatures/:id — brisanje tonaliteta
 */
@ApiTags('Key Signatures')
@ApiBearerAuth('access-token') // Prikazuje "Authorize" gumb u Swagger UI-u
@Controller('key-signatures')
export class KeySignaturesController {
  constructor(
    private readonly keySignaturesService: KeySignaturesService,
  ) {}

  // ────────────────────────────────────────────
  //  Javni endpointi — dostupni bez JWT autentikacije
  // ────────────────────────────────────────────

  /**
   * Dohvaćanje svih tonaliteta iz kataloga — JAVNA RUTA.
   *
   * Koristi se na frontend-u za prikaz dropdowna tonaliteta
   * pri kreiranju i ažuriranju kompozicije.
   *
   * @returns Lista svih tonaliteta sortirano po nazivu (A-Z)
   */
  @Get()
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Dohvat svih tonaliteta (javno)' })
  @ApiResponse({ status: 200, description: 'Lista tonaliteta' })
  public findAll() {
    return this.keySignaturesService.findAll();
  }

  /**
   * Dohvaćanje tonaliteta po UUID-u — JAVNA RUTA.
   *
   * @param id - UUID tonaliteta iz URL parametra
   * @returns KeySignature entitet
   */
  @Get(':id')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Dohvat tonaliteta po ID-u (javno)' })
  @ApiParam({ name: 'id', description: 'UUID tonaliteta', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Tonalitet pronađen' })
  @ApiResponse({ status: 404, description: 'Tonalitet nije pronađen' })
  public getKeySignatureById(@Param('id', ParseUUIDPipe) id: string) {
    return this.keySignaturesService.getKeySignatureById(id);
  }

  // ────────────────────────────────────────────
  //  Zaštićeni endpointi — zahtijevaju JWT autentikaciju
  // ────────────────────────────────────────────

  /**
   * Kreiranje novog tonaliteta u katalogu.
   *
   * Zahtijeva JWT autentikaciju (default Bearer guard).
   *
   * @param createKeySignatureDto - Podaci za kreiranje tonaliteta
   * @returns Kreirani KeySignature entitet
   */
  @Post()
  @ApiOperation({ summary: 'Kreiranje novog tonaliteta' })
  @ApiResponse({ status: 201, description: 'Tonalitet uspješno kreiran' })
  @ApiResponse({
    status: 409,
    description: 'Tonalitet s tim nazivom već postoji',
  })
  public createKeySignature(
    @Body() createKeySignatureDto: CreateKeySignatureDto,
  ) {
    return this.keySignaturesService.createKeySignature(createKeySignatureDto);
  }

  /**
   * Ažuriranje tonaliteta po UUID-u.
   *
   * Zahtijeva JWT autentikaciju (default Bearer guard).
   *
   * @param id - UUID tonaliteta iz URL parametra
   * @param updateKeySignatureDto - Polja za ažuriranje (name?, type?, rootNote?)
   * @returns Ažurirani KeySignature entitet
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje tonaliteta po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID tonaliteta', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Tonalitet ažuriran' })
  @ApiResponse({ status: 400, description: 'Tonalitet ne postoji' })
  @ApiResponse({
    status: 409,
    description: 'Tonalitet s tim nazivom već postoji',
  })
  public updateKeySignature(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateKeySignatureDto: UpdateKeySignatureDto,
  ) {
    return this.keySignaturesService.updateKeySignature(
      updateKeySignatureDto,
      id,
    );
  }

  /**
   * Brisanje tonaliteta iz kataloga po UUID-u.
   *
   * Zahtijeva JWT autentikaciju (default Bearer guard).
   *
   * @param id - UUID tonaliteta iz URL parametra
   * @returns Objekt s oznakom uspješnosti i ID-em obrisanog tonaliteta
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje tonaliteta po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID tonaliteta', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Tonalitet obrisan' })
  public deleteKeySignature(@Param('id', ParseUUIDPipe) id: string) {
    return this.keySignaturesService.removeKeySignature(id);
  }
}
