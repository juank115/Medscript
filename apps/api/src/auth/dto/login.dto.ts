import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'dr@test.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'dr1234' })
  @IsString()
  @MinLength(6)
  password: string;
}
