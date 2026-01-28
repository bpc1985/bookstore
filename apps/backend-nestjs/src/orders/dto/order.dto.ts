import { IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  shipping_address: string;
}

export class OrderStatusUpdateDto {
  @ApiProperty({ enum: ['pending', 'paid', 'cancelled', 'shipped', 'completed'] })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
