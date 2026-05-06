import { PartialType } from '@nestjs/swagger';
import { CreateSetlistDto } from './create-setlist.dto';

export class UpdateSetlistDto extends PartialType(CreateSetlistDto) {}
