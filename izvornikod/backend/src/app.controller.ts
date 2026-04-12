import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Korijenski kontroler aplikacije.
 *
 * Pruža osnovni health-check endpoint na root ruti (/).
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health-check endpoint.
   * @returns Pozdravna poruka koja potvrđuje da API radi
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
