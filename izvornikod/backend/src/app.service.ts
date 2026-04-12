import { Injectable } from '@nestjs/common';

/**
 * Korijenski servis aplikacije.
 *
 * Sadrži osnovnu poslovnu logiku za root kontroler.
 */
@Injectable()
export class AppService {
  /**
   * Vraća pozdravnu poruku za health-check endpoint.
   * @returns Statička pozdravna poruka
   */
  getHello(): string {
    return 'Hello World!';
  }
}
