import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty({ default: 'bearer' })
  token_type: string = 'bearer';
}

export class TokenRefreshDto {
  @ApiProperty()
  @IsString()
  refresh_token: string;
}

export class LogoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
