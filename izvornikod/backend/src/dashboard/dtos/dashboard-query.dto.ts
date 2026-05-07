import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum DashboardPeriod {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
  ONE_YEAR = '1y',
  ALL = 'all',
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: DashboardPeriod, default: DashboardPeriod.THIRTY_DAYS })
  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod = DashboardPeriod.THIRTY_DAYS;
}
