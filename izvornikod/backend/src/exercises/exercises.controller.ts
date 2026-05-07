import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ExercisesService } from './providers/exercises.service';
import { RecommendationsQueryDto } from './dtos/recommendations-query.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';

@ApiTags('Exercises')
@ApiBearerAuth('access-token')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('recommendations')
  @ApiOperation({
    summary:
      'Personalizirane preporuke vježbi (rule-based weakness + adaptive difficulty)',
  })
  @ApiResponse({ status: 200 })
  public recommendations(
    @UserPayload('sub') userId: string,
    @Query() query: RecommendationsQueryDto,
  ) {
    return this.exercisesService.recommend(
      userId,
      query.targetArea,
      query.limit,
    );
  }

  @Get('weakness-scores')
  @ApiOperation({ summary: 'Trenutni weakness scores po target area-u (debug/dashboard)' })
  public weaknessScores(@UserPayload('sub') userId: string) {
    return this.exercisesService.getWeaknessScores(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Sve EXERCISE compositions u sustavu' })
  public findAll() {
    return this.exercisesService.findAll();
  }
}
