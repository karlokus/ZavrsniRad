import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SetlistsService } from './providers/setlists.service';
import { CreateSetlistDto } from './dtos/create-setlist.dto';
import { UpdateSetlistDto } from './dtos/update-setlist.dto';
import { AddCompositionToSetlistDto } from './dtos/add-composition-to-setlist.dto';
import { ReorderSetlistDto } from './dtos/reorder-setlist.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

@ApiTags('Setlists')
@ApiBearerAuth('access-token')
@Controller('setlists')
export class SetlistsController {
  constructor(private readonly setlistsService: SetlistsService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje nove setliste' })
  @ApiResponse({ status: 201 })
  public createSetlist(
    @UserPayload('sub') userId: string,
    @Body() dto: CreateSetlistDto,
  ) {
    return this.setlistsService.createSetlist(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista korisnikovih setlista (sortirano A-Z)' })
  @ApiResponse({ status: 200 })
  public findAll(@UserPayload('sub') userId: string) {
    return this.setlistsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Setlista s pjesmama (po pozicijama) + masteryAverage + songCount',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  public getSetlistById(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.setlistsService.getSetlistById(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje naziva ili opisa setliste' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  public updateSetlist(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
    @Body() dto: UpdateSetlistDto,
  ) {
    return this.setlistsService.updateSetlist(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje setliste (CASCADE briše veze)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  public deleteSetlist(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.setlistsService.removeSetlist(id, userId);
  }

  @Post(':id/compositions')
  @ApiOperation({ summary: 'Dodaj kompoziciju u setlistu (append ili insert)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 404, description: 'Setlista ili kompozicija ne postoji' })
  @ApiResponse({ status: 409, description: 'Pjesma je već u setlisti' })
  public addComposition(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
    @Body() dto: AddCompositionToSetlistDto,
  ) {
    return this.setlistsService.addComposition(id, dto, userId);
  }

  @Delete(':id/compositions/:compositionId')
  @ApiOperation({ summary: 'Ukloni pjesmu iz setliste' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'compositionId', format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  public removeComposition(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('compositionId', ParseUUIDPipe) compositionId: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.setlistsService.removeComposition(id, compositionId, userId);
  }

  @Put(':id/compositions/reorder')
  @ApiOperation({
    summary: 'Preuredi cijelu setlistu — body: { items: [{compositionId, position}] }',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Lista nepotpuna ili duple pozicije' })
  public reorder(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
    @Body() dto: ReorderSetlistDto,
  ) {
    return this.setlistsService.reorder(id, dto, userId);
  }
}
