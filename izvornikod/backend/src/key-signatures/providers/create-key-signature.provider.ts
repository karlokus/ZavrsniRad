import {
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateKeySignatureDto } from '../dtos/create-key-signature.dto';
import { KeySignature } from '../entities/key-signature.entity';
import { FindKeySignatureProvider } from './find-key-signature.provider';

/**
 * Provider za kreiranje novog tonaliteta u bazi podataka.
 *
 * Provjerava duplikat po nazivu prije kreiranja i baca
 * ConflictException ako tonalitet s istim nazivom već postoji.
 */
@Injectable()
export class CreateKeySignatureProvider {
  constructor(
    /** Provider za provjeru postoji li tonalitet s istim nazivom */
    private readonly findKeySignatureProvider: FindKeySignatureProvider,

    /** TypeORM repozitorij za KeySignature entitet */
    @InjectRepository(KeySignature)
    private readonly keySignaturesRepository: Repository<KeySignature>,
  ) {}

  /**
   * Kreira novi tonalitet u bazi podataka.
   *
   * Flow:
   * 1. Provjera postoji li tonalitet s istim nazivom
   * 2. Kreiranje KeySignature entiteta
   * 3. Spremanje u bazu s error handling-om
   *
   * @param createKeySignatureDto - Podaci za kreiranje tonaliteta (name, type, rootNote)
   * @returns Kreirani KeySignature entitet
   * @throws ConflictException — ako tonalitet s istim nazivom već postoji
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async createKeySignature(
    createKeySignatureDto: CreateKeySignatureDto,
  ): Promise<KeySignature> {
    // Provjera postoji li tonalitet s istim nazivom
    const existing = await this.findKeySignatureProvider.findOneByName(
      createKeySignatureDto.name,
    );

    if (existing) {
      throw new ConflictException(
        'Tonalitet s ovim nazivom već postoji',
      );
    }

    // Kreiranje KeySignature entiteta
    const newKeySignature = this.keySignaturesRepository.create(
      createKeySignatureDto,
    );

    try {
      // Spremanje tonaliteta u bazu
      return await this.keySignaturesRepository.save(newKeySignature);
    } catch (error: unknown) {
      // Hvatanje PostgreSQL unique constraint greške za name
      if (error instanceof Error && 'detail' in error) {
        const detail = (error as { detail: string }).detail;
        if (detail.includes('name')) {
          throw new ConflictException('Naziv tonaliteta mora biti jedinstven');
        }
      }
      // Sve ostale greške → generička poruka
      const errMessage = (error as Error).message;
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description:
            'Error connecting to the database, error message: ' + errMessage,
        },
      );
    }
  }
}
