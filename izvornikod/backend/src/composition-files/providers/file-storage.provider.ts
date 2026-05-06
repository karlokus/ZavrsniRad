import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { B2ClientProvider } from './b2-client.provider';

/**
 * Apstrakcija nad B2 (S3) storageom.
 *
 * Sva upravljanje binarnim sadržajem ide kroz ovaj provider; ostali
 * provideri (create/delete) nikad ne komuniciraju s S3 SDK-om direktno.
 * Ako sutra promijenimo storage backend (npr. lokalni filesystem ili AWS S3),
 * mijenja se samo ova klasa.
 */
@Injectable()
export class FileStorageProvider {
  private readonly logger = new Logger(FileStorageProvider.name);

  constructor(private readonly b2: B2ClientProvider) {}

  /**
   * Uploada binarni buffer u B2 bucket pod zadanim ključem.
   *
   * @param key - object key u bucketu
   * @param body - binarni sadržaj
   * @param mimeType - Content-Type
   */
  public async upload(
    key: string,
    body: Buffer,
    mimeType: string,
  ): Promise<void> {
    await this.b2.getClient().send(
      new PutObjectCommand({
        Bucket: this.b2.getBucketName(),
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );
  }

  /**
   * Generira presigned download URL valjan ~5 min.
   * Klijent ide direktno na B2; backend ne plaća bandwidth proxyja.
   *
   * @param key - object key u bucketu
   * @param fileName - originalno ime za Content-Disposition header (download dialog)
   */
  public async getSignedDownloadUrl(
    key: string,
    fileName: string,
  ): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.b2.getBucketName(),
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    });
    return getSignedUrl(this.b2.getClient(), cmd, { expiresIn: 300 });
  }

  /**
   * Vraća čitljivi stream za proxy download endpoint.
   * Backend čita iz B2 i prosljeđuje klijentu.
   */
  public async getStream(
    key: string,
  ): Promise<{ stream: Readable; mimeType?: string; size?: number }> {
    const out = await this.b2.getClient().send(
      new GetObjectCommand({
        Bucket: this.b2.getBucketName(),
        Key: key,
      }),
    );
    return {
      stream: out.Body as Readable,
      mimeType: out.ContentType,
      size: out.ContentLength,
    };
  }

  /**
   * Briše objekt iz bucketa. Idempotentno — B2 ne baca grešku
   * ako objekt već ne postoji.
   */
  public async delete(key: string): Promise<void> {
    try {
      await this.b2.getClient().send(
        new DeleteObjectCommand({
          Bucket: this.b2.getBucketName(),
          Key: key,
        }),
      );
    } catch (error: unknown) {
      // Loggamo ali ne propagiramo — da DELETE flow uvijek može obrisati DB redak
      this.logger.warn(
        `B2 delete failed for key ${key}: ${(error as Error).message}`,
      );
    }
  }
}
