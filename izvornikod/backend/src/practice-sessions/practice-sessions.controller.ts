import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PracticeSessionsService } from './providers/practice-sessions.service';
import { CreatePracticeSessionDto } from './dtos/create-practice-session.dto';
import { QueryPracticeSessionsDto } from './dtos/query-practice-sessions.dto';
import { TrendsQueryDto } from './dtos/trends-query.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

@ApiTags('Practice Sessions')
@ApiBearerAuth('access-token')
@Controller('practice-sessions')
export class PracticeSessionsController {
  constructor(
    private readonly practiceSessionsService: PracticeSessionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Bilježenje nove sesije vježbanja (FZ-L07)' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 404, description: 'Kompozicija nije pronađena' })
  public create(
    @UserPayload('sub') userId: string,
    @Body() dto: CreatePracticeSessionDto,
  ) {
    return this.practiceSessionsService.create(dto, userId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Trendovi performansi po danima (FZ-L10, FZ-D06)' })
  public getTrends(
    @UserPayload('sub') userId: string,
    @Query() query: TrendsQueryDto,
  ) {
    return this.practiceSessionsService.getTrends(
      userId,
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('composition/:compositionId/stats')
  @ApiOperation({ summary: 'Agregirana statistika sesija za kompoziciju (FZ-L09)' })
  @ApiParam({ name: 'compositionId', format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Kompozicija nije pronađena' })
  public getStats(
    @Param('compositionId', ParseUUIDPipe) compositionId: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.practiceSessionsService.getStatsForComposition(
      compositionId,
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji sesije po ID-u' })
  @ApiParam({ name: 'id', format: 'uuid' })
  public getById(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.practiceSessionsService.getById(id, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Paginirana povijest sesija (FZ-L08)' })
  public findAll(
    @UserPayload('sub') userId: string,
    @Query() query: QueryPracticeSessionsDto,
  ) {
    return this.practiceSessionsService.findAll(userId, query);
  }
}
