import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from '../providers/dashboard.service';
import { DashboardQueryDto } from '../dtos/dashboard-query.dto';
import { UserPayload } from '../../auth/decorators/user-payload.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Sažetak (FZ-D01): totalSongs, learnedCount, activeStreak, upcomingPractices' })
  @ApiResponse({ status: 200 })
  public summary(@UserPayload('sub') userId: string) {
    return this.dashboardService.summary(userId);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Line chart napretka — avgMastery po danu (FZ-D02)' })
  public progress(
    @UserPayload('sub') userId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.progress(userId, query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Pie chart raspodjele po kategorijama (FZ-D03)' })
  public categories(@UserPayload('sub') userId: string) {
    return this.dashboardService.categories(userId);
  }

  @Get('needs-practice')
  @ApiOperation({ summary: 'Top 5 pjesama s najnižim mastery prosjekom (FZ-D04)' })
  public needsPractice(@UserPayload('sub') userId: string) {
    return this.dashboardService.needsPractice(userId);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Kalendarska heatmapa aktivnosti (FZ-D05)' })
  public heatmap(
    @UserPayload('sub') userId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.heatmap(userId, query);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Prosječni accuracy/rhythm/tempo s trendovima (FZ-D06)' })
  public performance(
    @UserPayload('sub') userId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.performance(userId, query);
  }
}
