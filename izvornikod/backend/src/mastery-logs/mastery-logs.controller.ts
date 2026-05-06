import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MasteryLogsService } from './providers/mastery-logs.service';
import { QueryMasteryLogsDto } from './dtos/query-mastery-logs.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

/**
 * Kontroler za povijest mastery promjena (FZ-R15, FZ-R16, FZ-R17).
 *
 * Read-only — kreiranje logova ide kroz UpdateCompositionProvider.
 *
 * Endpointi:
 * - GET /mastery-logs?compositionId=&aspect=&dateFrom=&dateTo= — povijest za line chart
 * - GET /mastery-logs/composition/:compositionId/summary — agregirana krivulja napretka
 */
@ApiTags('Mastery Logs')
@ApiBearerAuth('access-token')
@Controller('mastery-logs')
export class MasteryLogsController {
  constructor(private readonly masteryLogsService: MasteryLogsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Povijest mastery promjena s filterima (kronološki sortirano ASC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista MasteryLog zapisa',
  })
  public findAll(
    @UserPayload('sub') userId: string,
    @Query() query: QueryMasteryLogsDto,
  ) {
    return this.masteryLogsService.findAll(userId, query);
  }

  @Get('composition/:compositionId/summary')
  @ApiOperation({
    summary: 'Agregirana krivulja napretka po aspektima (NOTES/LYRICS/PLAYING)',
  })
  @ApiParam({
    name: 'compositionId',
    description: 'UUID kompozicije',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Objekt s tri serije točaka po aspektu',
  })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kompoziciji' })
  @ApiResponse({ status: 404, description: 'Kompozicija nije pronađena' })
  public getSummary(
    @Param('compositionId', ParseUUIDPipe) compositionId: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.masteryLogsService.getSummary(compositionId, userId);
  }
}
