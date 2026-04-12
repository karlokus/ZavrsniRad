import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './providers/categories.service';
import { FindCategoryProvider } from './providers/find-category.provider';
import { CreateCategoryProvider } from './providers/create-category.provider';
import { UpdateCategoryProvider } from './providers/update-category.provider';

/**
 * Modul za upravljanje kategorijama pjesama.
 *
 * Kategorije su user-owned — svaka pripada točno jednom korisniku.
 * Svi endpointi zahtijevaju JWT autentikaciju i provjeravaju vlasništvo.
 *
 * Pruža CRUD operacije nad kategorijama prema specifikaciji (sekcija 3.2).
 * Relevantni FZ: R03, R04, R05, R07.
 *
 * Exporta:
 * - TypeOrmModule — za pristup Category repozitoriju u drugim modulima
 * - FindCategoryProvider — za dohvaćanje kategorija u budućim modulima (npr. Compositions)
 */
@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService, // Fasadni servis
    FindCategoryProvider, // Pronalaženje kategorija s provjerom vlasništva
    CreateCategoryProvider, // Kreiranje nove kategorije
    UpdateCategoryProvider, // Ažuriranje kategorije
  ],
  imports: [
    // Registracija Category entiteta za TypeORM repozitorij
    TypeOrmModule.forFeature([Category]),
  ],
  exports: [
    // TypeOrmModule za pristup Category repozitoriju u drugim modulima
    TypeOrmModule,
    // FindCategoryProvider za dohvaćanje kategorija u budućim modulima
    FindCategoryProvider,
  ],
})
export class CategoriesModule {}
