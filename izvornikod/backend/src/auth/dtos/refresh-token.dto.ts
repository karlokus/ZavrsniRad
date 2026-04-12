import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO za obnovu tokena (refresh).
 *
 * Klijent šalje refresh token na POST /auth/refresh-tokens
 * kako bi dobio novi par access + refresh tokena bez ponovne prijave.
 */
export class RefreshTokenDto {
  /** Refresh token dobiven prilikom prijave ili prethodnog refresha */
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTY5...',
    description: 'Refresh token za dobivanje novog access tokena',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}
