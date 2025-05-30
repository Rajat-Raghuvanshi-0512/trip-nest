import { IsString, IsOptional, MaxLength } from 'class-validator';

export class JoinRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Message must not exceed 500 characters' })
  message?: string;
}
