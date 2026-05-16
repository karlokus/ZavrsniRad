import { InjectionToken } from '@angular/core';

export interface EnvConfig {
  apiBaseUrl: string;
  production: boolean;
}

export const ENV = new InjectionToken<EnvConfig>('ENV');
