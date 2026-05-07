import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { CompositionFile } from './entities/composition-file.entity';
import { CompositionFilesController } from './composition-files.controller';
import { CompositionFilesService } from './providers/composition-files.service';
import { CreateCompositionFileProvider } from './providers/create-composition-file.provider';
import { FindCompositionFileProvider } from './providers/find-composition-file.provider';
import { DeleteCompositionFileProvider } from './providers/delete-composition-file.provider';
import { FileStorageProvider } from './providers/file-storage.provider';
import { B2ClientProvider } from './providers/b2-client.provider';
import { MidiParserProvider } from './providers/midi-parser.provider';
import { CompositionsModule } from '../compositions/compositions.module';
import { InstrumentsModule } from '../instruments/instruments.module';
import storageConfig from '../config/storage.config';

/**
 * Modul za CompositionFile operacije (FZ-R08–R13).
 *
 * - Multer u memory-storage modu (file dolazi kao Buffer u providerima).
 * - B2 storage abstrakcija; ostali provideri ne diraju S3 SDK direktno.
 * - storage.config registriran ovdje (forFeature) — dostupan u cijelom modulu.
 */
@Module({
  controllers: [CompositionFilesController],
  providers: [
    CompositionFilesService,
    CreateCompositionFileProvider,
    FindCompositionFileProvider,
    DeleteCompositionFileProvider,
    FileStorageProvider,
    B2ClientProvider,
    MidiParserProvider,
  ],
  imports: [
    ConfigModule.forFeature(storageConfig),
    TypeOrmModule.forFeature([CompositionFile]),
    MulterModule.register({}), // memory storage default
    CompositionsModule, // FindCompositionProvider za vlasništvo
    InstrumentsModule, // FindInstrumentProvider za FK validaciju
  ],
  exports: [TypeOrmModule],
})
export class CompositionFilesModule {}
