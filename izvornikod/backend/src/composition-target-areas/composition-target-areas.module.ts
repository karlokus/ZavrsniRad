import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompositionTargetArea } from './entities/composition-target-area.entity';
import { CompositionTargetAreasController } from './composition-target-areas.controller';
import { CompositionTargetAreasService } from './providers/composition-target-areas.service';
import { CreateCompositionTargetAreaProvider } from './providers/create-composition-target-area.provider';
import { FindCompositionTargetAreaProvider } from './providers/find-composition-target-area.provider';
import { UpdateCompositionTargetAreaProvider } from './providers/update-composition-target-area.provider';
import { DeleteCompositionTargetAreaProvider } from './providers/delete-composition-target-area.provider';
import { CompositionsModule } from '../compositions/compositions.module';

/**
 * Modul za upravljanje CompositionTargetArea zapisima (FZ-L11, FZ-L12).
 *
 * Sub-resurs Compositiona — vlasništvo se nasljeđuje preko parent kompozicije.
 *
 * Importa:
 * - TypeOrmModule.forFeature([CompositionTargetArea]) za repozitorij
 * - CompositionsModule za FindCompositionProvider (validacija parent kompozicije)
 *
 * Exporta TypeOrmModule i FindCompositionTargetAreaProvider za buduće
 * module (Exercise Recommender u Fazi 8 koristi target areas za matching).
 */
@Module({
  controllers: [CompositionTargetAreasController],
  providers: [
    CompositionTargetAreasService,
    CreateCompositionTargetAreaProvider,
    FindCompositionTargetAreaProvider,
    UpdateCompositionTargetAreaProvider,
    DeleteCompositionTargetAreaProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([CompositionTargetArea]),
    CompositionsModule,
  ],
  exports: [TypeOrmModule, FindCompositionTargetAreaProvider],
})
export class CompositionTargetAreasModule {}
