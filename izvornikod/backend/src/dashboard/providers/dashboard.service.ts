import { Injectable } from '@nestjs/common';
import { DashboardStatsProvider } from './dashboard-stats.provider';
import { DashboardQueryDto } from '../dtos/dashboard-query.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly statsProvider: DashboardStatsProvider) {}

  public summary(userId: string) {
    return this.statsProvider.getSummary(userId);
  }
  public progress(userId: string, query: DashboardQueryDto) {
    return this.statsProvider.getProgress(userId, query);
  }
  public categories(userId: string) {
    return this.statsProvider.getCategoriesDistribution(userId);
  }
  public needsPractice(userId: string) {
    return this.statsProvider.getNeedsPractice(userId);
  }
  public heatmap(userId: string, query: DashboardQueryDto) {
    return this.statsProvider.getHeatmap(userId, query);
  }
  public performance(userId: string, query: DashboardQueryDto) {
    return this.statsProvider.getPerformance(userId, query);
  }
}
