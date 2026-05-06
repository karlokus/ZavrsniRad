import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setlist } from './entities/setlist.entity';
import { SetlistComposition } from './entities/setlist-composition.entity';
import { SetlistsController } from './setlists.controller';
import { SetlistsService } from './providers/setlists.service';
import { CreateSetlistProvider } from './providers/create-setlist.provider';
import { FindSetlistProvider } from './providers/find-setlist.provider';
import { UpdateSetlistProvider } from './providers/update-setlist.provider';
import { DeleteSetlistProvider } from './providers/delete-setlist.provider';
import { ManageSetlistCompositionsProvider } from './providers/manage-setlist-compositions.provider';
import { CompositionsModule } from '../compositions/compositions.module';

@Module({
  controllers: [SetlistsController],
  providers: [
    SetlistsService,
    CreateSetlistProvider,
    FindSetlistProvider,
    UpdateSetlistProvider,
    DeleteSetlistProvider,
    ManageSetlistCompositionsProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([Setlist, SetlistComposition]),
    CompositionsModule, // FindCompositionProvider za vlasništvo pjesama
  ],
  exports: [TypeOrmModule],
})
export class SetlistsModule {}
