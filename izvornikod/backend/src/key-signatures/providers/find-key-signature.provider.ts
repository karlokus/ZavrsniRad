import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeySignature } from '../entities/key-signature.entity';

/**
 * Provider za pronalaženje tonaliteta u bazi podataka.
 *
 * Koristi se u:
 * - KeySignaturesService — dohvaćanje tonaliteta po ID-u i lista svih
 * - CreateKeySignatureProvider — provjera duplikata po nazivu
 * - UpdateKeySignatureProvider — dohvaćanje tonaliteta prije ažuriranja
 * - Budući moduli — dohvaćanje tonaliteta za relacije (exportan iz KeySignaturesModule)
 */
@Injectable()
export class FindKeySignatureProvider {
  constructor(
    /** TypeORM repozitorij za KeySignature entitet */
    @InjectRepository(KeySignature)
    private readonly keySignaturesRepository: Repository<KeySignature>,
  ) {}

  /**
   * Pronalazi tonalitet po UUID-u.
   *
   * @param id - UUID tonaliteta
   * @returns KeySignature entitet ili null ako ne postoji
   */
  public async findOneById(id: string): Promise<KeySignature | null> {
    return await this.keySignaturesRepository.findOneBy({ id });
  }

  /**
   * Pronalazi tonalitet po nazivu.
   *
   * Koristi se za provjeru duplikata pri kreiranju i ažuriranju.
   *
   * @param name - Naziv tonaliteta (npr. "C dur")
   * @returns KeySignature entitet ili null ako ne postoji
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async findOneByName(name: string): Promise<KeySignature | null> {
    try {
      return await this.keySignaturesRepository.findOneBy({ name });
    } catch (error) {
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

  /**
   * Dohvaća sve tonalitete iz baze, sortirano po nazivu (A-Z).
   *
   * @returns Lista svih tonaliteta
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async findAll(): Promise<KeySignature[]> {
    try {
      // Sortiranje po nazivu uzlazno (A-Z)
      return await this.keySignaturesRepository.find({
        order: { name: 'ASC' },
      });
    } catch (error) {
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
