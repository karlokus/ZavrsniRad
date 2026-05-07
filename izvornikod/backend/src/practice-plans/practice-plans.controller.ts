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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PracticePlansService } from './providers/practice-plans.service';
import { CreatePracticePlanDto } from './dtos/create-practice-plan.dto';
import { UpdatePracticePlanDto } from './dtos/update-practice-plan.dto';
import { QueryPracticePlansDto } from './dtos/query-practice-plans.dto';
import { AddSongToPlanDto } from './dtos/add-song-to-plan.dto';
import { ReorderPlanSongsDto } from './dtos/reorder-plan-songs.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

@ApiTags('Practice Plans')
@ApiBearerAuth('access-token')
@Controller('practice-plans')
export class PracticePlansController {
  constructor(private readonly practicePlansService: PracticePlansService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiraj plan ili recurring template (FZ-L16, FZ-L17)' })
  @ApiResponse({ status: 201 })
  public create(
    @UserPayload('sub') userId: string,
    @Body() dto: CreatePracticePlanDto,
  ) {
    return this.practicePlansService.create(dto, userId);
  }

  @Get('streak')
  @ApiOperation({ summary: 'Trenutni streak završenih dana (FZ-L19)' })
  public getStreak(@UserPayload('sub') userId: string) {
    return this.practicePlansService.getStreak(userId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Lista korisnikovih recurring template-a' })
  public findTemplates(@UserPayload('sub') userId: string) {
    return this.practicePlansService.findTemplates(userId);
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista planova u rasponu (lazy materializacija recurring instanci)',
  })
  public findAll(
    @UserPayload('sub') userId: string,
    @Query() query: QueryPracticePlansDto,
  ) {
    return this.practicePlansService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Plan + pjesme po ID-u' })
  @ApiParam({ name: 'id', format: 'uuid' })
  public getById(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.practicePlansService.getById(id, userId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Označi plan kao završen (FZ-L18)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  public markCompleted(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.practicePlansService.markCompleted(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje plana' })
  @ApiParam({ name: 'id', format: 'uuid' })
  public update(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
    @Body() dto: UpdatePracticePlanDto,
  ) {
    return this.practicePlansService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje plana ili template-a' })
  @ApiParam({ name: 'id', format: 'uuid' })
  public remove(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.practicePlansService.remove(id, userId);
  }

  @Post(':id/songs')
  @ApiOperation({ summary: 'Dodaj pjesmu u plan' })
  @ApiParam({ name: 'id', format: 'uuid' })
  public addSong(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
    @Body() dto: AddSongToPlanDto,
  ) {
    return this.practicePlansService.addSong(id, dto, userId);
  }

  @Delete(':id/songs/:compositionId')
  @ApiOperation({ summary: 'Ukloni pjesmu iz plana' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'compositionId', format: 'uuid' })
  public removeSong(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('compositionId', ParseUUIDPipe) compositionId: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.practicePlansService.removeSong(id, compositionId, userId);
  }

  @Put(':id/songs/reorder')
  @ApiOperation({ summary: 'Preuredi pjesme u planu' })
  @ApiParam({ name: 'id', format: 'uuid' })
  public reorder(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
    @Body() dto: ReorderPlanSongsDto,
  ) {
    return this.practicePlansService.reorder(id, dto, userId);
  }
}
