import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { MediaType } from '../../entities/group-media.entity';

export class UploadMediaDto {
  @IsEnum(MediaType)
  mediaType: MediaType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
