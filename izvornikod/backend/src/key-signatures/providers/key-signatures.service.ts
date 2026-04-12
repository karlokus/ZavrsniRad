import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeySignature } from '../entities/key-signature.entity';
import { CreateKeySignatureDto } from '../dtos/create-key-signature.dto';
import { UpdateKeySignatureDto } from '../dtos/update-key-signature.dto';
import { FindKeySignatureProvider } from './find-key-signature.provider';
import { CreateKeySignatureProvider } from './create-key-signature.provider';
import { UpdateKeySignatureProvider } from './update-key-signature.provider';

/**
 * Fasadni servis za upravljanje tonalitetima.
 *
 * Pruža sučelje za KeySignaturesController delegirajući operacije
 * specijaliziranim providerima. Pokriva CRUD operacije nad
 * shared katalogom tonaliteta prema specifikaciji (sekcija 3.3.1).
 */
@Injectable()
export class KeySignaturesService {
  constructor(
    /** TypeORM repozitorij za direktne operacije (delete) */
    @InjectRepository(KeySignature)
    private readonly keySignaturesRepository: Repository<KeySignature>,

    /** Provider za pronalaženje tonaliteta */
    private readonly findKeySignatureProvider: FindKeySignatureProvider,
    /** Provider za kreiranje tonaliteta */
    private readonly createKeySignatureProvider: CreateKeySignatureProvider,
    /** Provider za ažuriranje tonaliteta */
    private readonly updateKeySignatureProvider: UpdateKeySignatureProvider,
  ) {}

  /**
   * Kreira novi tonalitet — delegira na CreateKeySignatureProvider.
   *
   * @param createKeySignatureDto - Podaci za kreiranje tonaliteta
   * @returns Kreirani KeySignature entitet
   */
  public async createKeySignature(
    createKeySignatureDto: CreateKeySignatureDto,
  ): Promise<KeySignature> {
    return this.createKeySignatureProvider.createKeySignature(
      createKeySignatureDto,
    );
  }

  /**
   * Dohvaća sve tonalitete iz kataloga.
   *
   * Javno dostupan endpoint — koristi se na frontend-u
   * za prikaz dropdowna tonaliteta pri kreiranju kompozicije.
   *
   * @returns Lista svih tonaliteta sortirano po nazivu (A-Z)
   */
  public async findAll(): Promise<KeySignature[]> {
    return this.findKeySignatureProvider.findAll();
  }

  /**
   * Dohvaća tonalitet po ID-u.
   *
   * @param id - UUID tonaliteta
   * @returns KeySignature entitet
   * @throws NotFoundException — ako tonalitet ne postoji
   */
  public async getKeySignatureById(id: string): Promise<KeySignature> {
    // Pronalaženje tonaliteta po ID-u
    const keySignature = await this.findKeySignatureProvider.findOneById(id);

    if (!keySignature) {
      throw new NotFoundException('Tonalitet nije pronađen');
    }

    return keySignature;
  }

  /**
   * Ažurira tonalitet — delegira na UpdateKeySignatureProvider.
   *
   * @param updateKeySignatureDto - Polja za ažuriranje
   * @param id - UUID tonaliteta
   * @returns Ažurirani KeySignature entitet
   */
  public async updateKeySignature(
    updateKeySignatureDto: UpdateKeySignatureDto,
    id: string,
  ): Promise<KeySignature> {
    return this.updateKeySignatureProvider.updateKeySignature(
      updateKeySignatureDto,
      id,
    );
  }

  /**
   * Briše tonalitet iz kataloga.
   *
   * @param id - UUID tonaliteta za brisanje
   * @returns Objekt s oznakom uspješnosti i ID-em obrisanog tonaliteta
   */
  public async removeKeySignature(
    id: string,
  ): Promise<{ deleted: boolean; id: string }> {
    // Brisanje tonaliteta iz baze — affected > 0 znači da je brisanje uspjelo
    const result = await this.keySignaturesRepository.delete(id);
    return { deleted: (result.affected ?? 0) > 0, id };
  }
}
