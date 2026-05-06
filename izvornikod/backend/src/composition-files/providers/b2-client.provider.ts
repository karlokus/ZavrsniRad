import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

/**
 * Lazy-initialized S3 klijent konfiguriran za Backblaze B2 endpoint.
 *
 * B2 nudi S3-kompatibilan API, pa koristimo standardnu @aws-sdk/client-s3
 * biblioteku s prilagođenim endpointom i regionom (eu-central-003).
 *
 * Singleton — instanca se kreira jednom i reuse-a između zahtjeva.
 */
@Injectable()
export class B2ClientProvider {
  private client?: S3Client;

  constructor(private readonly configService: ConfigService) {}

  public getClient(): S3Client {
    if (!this.client) {
      this.client = new S3Client({
        endpoint: this.configService.getOrThrow<string>('storage.endpoint'),
        region: this.configService.getOrThrow<string>('storage.region'),
        credentials: {
          accessKeyId: this.configService.getOrThrow<string>('storage.keyId'),
          secretAccessKey: this.configService.getOrThrow<string>(
            'storage.applicationKey',
          ),
        },
        // B2 zahtijeva path-style URL-ove (https://endpoint/bucket/key)
        forcePathStyle: true,
      });
    }
    return this.client;
  }

  public getBucketName(): string {
    return this.configService.getOrThrow<string>('storage.bucketName');
  }
}
