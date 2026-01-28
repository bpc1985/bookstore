import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @ApiProperty()
  @IsInt()
  book_id: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number = 1;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
