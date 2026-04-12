import {
  BadRequestException,
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateKeySignatureDto } from '../dtos/update-key-signature.dto';
import { KeySignature } from '../entities/key-signature.entity';
import { FindKeySignatureProvider } from './find-key-signature.provider';

/**
 * Provider za ažuriranje tonaliteta u bazi podataka.
 *
 * Dohvaća tonalitet po ID-u, primjenjuje promjene iz DTO-a
 * i sprema ažurirani entitet.
 */
@Injectable()
export class UpdateKeySignatureProvider {
  constructor(
    /** Provider za pronalaženje tonaliteta prije ažuriranja */
    private readonly findKeySignatureProvider: FindKeySignatureProvider,

    /** TypeORM repozitorij za KeySignature entitet */
    @InjectRepository(KeySignature)
    private readonly keySignaturesRepository: Repository<KeySignature>,
  ) {}

  /**
   * Ažurira tonalitet u bazi podataka.
   *
   * @param updateKeySignatureDto - Polja za ažuriranje (name?, type?, rootNote?)
   * @param id - UUID tonaliteta koji se ažurira
   * @returns Ažurirani KeySignature entitet
   * @throws BadRequestException — ako tonalitet ne postoji
   * @throws ConflictException — ako ažuriranje uzrokuje duplikat naziva
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async updateKeySignature(
    updateKeySignatureDto: UpdateKeySignatureDto,
    id: string,
  ): Promise<KeySignature> {
    // Dohvaćanje trenutnog tonaliteta iz baze
    const keySignature = await this.findKeySignatureProvider.findOneById(id);

    if (!keySignature) {
      throw new BadRequestException('Tonalitet ne postoji');
    }

    // Ažuriranje polja — zadržava postojeću vrijednost ako polje nije poslano
    keySignature.name = updateKeySignatureDto.name ?? keySignature.name;
    keySignature.type = updateKeySignatureDto.type ?? keySignature.type;
    keySignature.rootNote =
      updateKeySignatureDto.rootNote ?? keySignature.rootNote;

    try {
      // Spremanje ažuriranog tonaliteta u bazu
      return await this.keySignaturesRepository.save(keySignature);
    } catch (error: unknown) {
      // Hvatanje PostgreSQL unique constraint greške za name
      if (error instanceof Error && 'detail' in error) {
        const detail = (error as { detail: string }).detail;
        if (detail.includes('name')) {
          throw new ConflictException('Naziv tonaliteta mora biti jedinstven');
        }
      }
      // Sve ostale greške → generička poruka
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        { description: 'Error connecting to the database' },
      );
    }
  }
}
