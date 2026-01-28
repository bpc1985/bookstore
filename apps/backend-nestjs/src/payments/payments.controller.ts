import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CheckoutDto } from './dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Complete order (mock payment)' })
  async checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.paymentsService.checkout(user.id, dto.order_id);
  }
}
