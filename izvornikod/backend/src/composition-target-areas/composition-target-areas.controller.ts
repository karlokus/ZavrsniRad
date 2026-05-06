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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CompositionTargetAreasService } from './providers/composition-target-areas.service';
import { CreateCompositionTargetAreaDto } from './dtos/create-composition-target-area.dto';
import { UpdateCompositionTargetAreaDto } from './dtos/update-composition-target-area.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

/**
 * Kontroler za upravljanje CompositionTargetArea zapisima (FZ-L11, FZ-L12).
 *
 * Sve rute zahtijevaju JWT autentikaciju (globalni AuthenticationGuard).
 * userId se uvijek čita iz JWT payloada.
 *
 * Endpointi su podijeljeni na dvije rute:
 * - /compositions/:compositionId/target-areas — kreiranje + lista za kompoziciju
 * - /composition-target-areas/:id — patch/delete jednog zapisa
 */
@ApiTags('Composition Target Areas')
@ApiBearerAuth('access-token')
@Controller()
export class CompositionTargetAreasController {
  constructor(
    private readonly targetAreasService: CompositionTargetAreasService,
  ) {}

  @Post('compositions/:compositionId/target-areas')
  @ApiOperation({ summary: 'Kreiranje novog target area zapisa za kompoziciju' })
  @ApiParam({
    name: 'compositionId',
    description: 'UUID kompozicije',
    format: 'uuid',
  })
  @ApiResponse({ status: 201, description: 'Target area uspješno kreiran' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kompoziciji' })
  @ApiResponse({ status: 404, description: 'Kompozicija nije pronađena' })
  @ApiResponse({
    status: 409,
    description: 'Target area za ovu kompoziciju već postoji',
  })
  public createTargetArea(
    @Param('compositionId', ParseUUIDPipe) compositionId: string,
    @UserPayload('sub') userId: string,
    @Body() dto: CreateCompositionTargetAreaDto,
  ) {
    return this.targetAreasService.createTargetArea(
      compositionId,
      dto,
      userId,
    );
  }

  @Get('compositions/:compositionId/target-areas')
  @ApiOperation({ summary: 'Dohvat svih target area zapisa kompozicije' })
  @ApiParam({
    name: 'compositionId',
    description: 'UUID kompozicije',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Lista target area zapisa' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kompoziciji' })
  @ApiResponse({ status: 404, description: 'Kompozicija nije pronađena' })
  public findAllForComposition(
    @Param('compositionId', ParseUUIDPipe) compositionId: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.targetAreasService.findAllByComposition(compositionId, userId);
  }

  @Patch('composition-target-areas/:id')
  @ApiOperation({
    summary: 'Ažuriranje target area zapisa (difficultyLevel, weightPercentage)',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID target area zapisa',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Target area ažuriran' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovom zapisu' })
  @ApiResponse({ status: 404, description: 'Target area zapis nije pronađen' })
  public updateTargetArea(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
    @Body() dto: UpdateCompositionTargetAreaDto,
  ) {
    return this.targetAreasService.updateTargetArea(id, dto, userId);
  }

  @Delete('composition-target-areas/:id')
  @ApiOperation({ summary: 'Brisanje target area zapisa' })
  @ApiParam({
    name: 'id',
    description: 'UUID target area zapisa',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Target area obrisan' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovom zapisu' })
  @ApiResponse({ status: 404, description: 'Target area zapis nije pronađen' })
  public deleteTargetArea(
    @Param('id', ParseUUIDPipe) id: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.targetAreasService.removeTargetArea(id, userId);
  }
}
