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
import { CategoriesService } from './providers/categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

/**
 * Kontroler za upravljanje kategorijama pjesama.
 *
 * Svi endpointi zahtijevaju JWT autentikaciju (globalni AuthenticationGuard).
 * Korisnik pristupa isključivo vlastitim kategorijama — userId se
 * uvijek čita iz JWT payloada, nikad iz URL-a ili tijela zahtjeva.
 *
 * Endpointi:
 * - POST /categories — kreiranje nove kategorije
 * - GET /categories — lista kategorija prijavljenog korisnika
 * - GET /categories/:id — dohvat kategorije po ID-u (s provjerom vlasništva)
 * - PATCH /categories/:id — ažuriranje kategorije (s provjerom vlasništva)
 * - DELETE /categories/:id — brisanje kategorije (s provjerom vlasništva)
 *
 * Relevantni FZ: R03, R04, R05, R07
 */
@ApiTags('Categories')
@ApiBearerAuth('access-token') // Prikazuje "Authorize" gumb u Swagger UI-u
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Kreiranje nove kategorije za prijavljenog korisnika.
   *
   * @param userId - UUID korisnika iz JWT payloada
   * @param createCategoryDto - Podaci za kreiranje kategorije (name, color?)
   * @returns Kreirana Category entitet
   */
  @Post()
  @ApiOperation({ summary: 'Kreiranje nove kategorije' })
  @ApiResponse({ status: 201, description: 'Kategorija uspješno kreirana' })
  @ApiResponse({
    status: 409,
    description: 'Korisnik već ima kategoriju s istim nazivom',
  })
  public createCategory(
    @UserPayload('sub') userId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.createCategory(createCategoryDto, userId);
  }

  /**
   * Dohvaćanje svih kategorija prijavljenog korisnika.
   *
   * Vraća samo kategorije koje pripadaju aktivnom korisniku,
   * sortirane po nazivu uzlazno (A-Z).
   *
   * @param userId - UUID korisnika iz JWT payloada
   * @returns Lista kategorija korisnika
   */
  @Get()
  @ApiOperation({ summary: 'Dohvat svih kategorija prijavljenog korisnika' })
  @ApiResponse({ status: 200, description: 'Lista kategorija korisnika' })
  public findAll(@UserPayload('sub') userId: string) {
    return this.categoriesService.findAll(userId);
  }

  /**
   * Dohvaćanje kategorije po UUID-u s provjerom vlasništva.
   *
   * @param id - UUID kategorije iz URL parametra
   * @param userId - UUID korisnika iz JWT payloada
   * @returns Category entitet
   */
  @Get(':id')
  @ApiOperation({ summary: 'Dohvat kategorije po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID kategorije', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Kategorija pronađena' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kategoriji' })
  @ApiResponse({ status: 404, description: 'Kategorija nije pronađena' })
  public getCategoryById(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.categoriesService.getCategoryById(id, userId);
  }

  /**
   * Ažuriranje kategorije po UUID-u s provjerom vlasništva.
   *
   * @param id - UUID kategorije iz URL parametra
   * @param userId - UUID korisnika iz JWT payloada
   * @param updateCategoryDto - Polja za ažuriranje (name?, color?)
   * @returns Ažurirana Category entitet
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje kategorije po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID kategorije', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Kategorija ažurirana' })
  @ApiResponse({ status: 400, description: 'Kategorija ne postoji' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kategoriji' })
  @ApiResponse({
    status: 409,
    description: 'Korisnik već ima kategoriju s istim nazivom',
  })
  public updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(updateCategoryDto, id, userId);
  }

  /**
   * Brisanje kategorije po UUID-u s provjerom vlasništva.
   *
   * @param id - UUID kategorije iz URL parametra
   * @param userId - UUID korisnika iz JWT payloada
   * @returns Objekt s oznakom uspješnosti i ID-em obrisane kategorije
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje kategorije po ID-u' })
  @ApiParam({ name: 'id', description: 'UUID kategorije', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Kategorija obrisana' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kategoriji' })
  @ApiResponse({ status: 404, description: 'Kategorija nije pronađena' })
  public deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.categoriesService.removeCategory(id, userId);
  }
}
