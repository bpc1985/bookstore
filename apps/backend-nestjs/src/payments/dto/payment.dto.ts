import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty()
  @IsInt()
  order_id: number;
}
