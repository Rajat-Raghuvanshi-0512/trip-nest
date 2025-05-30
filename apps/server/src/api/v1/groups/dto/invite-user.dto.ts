import { IsString, IsOptional, IsEmail, IsUUID } from 'class-validator';

export class InviteUserDto {
  @IsOptional()
  @IsUUID('4', { message: 'Invalid user ID format' })
  userId?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;
}
