import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'dr@test.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'dr123' })
  @IsString()
  @MinLength(4)
  password: string;
}
