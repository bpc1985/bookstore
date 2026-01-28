import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== 'pending') {
      throw new BadRequestException('Order is not in pending status');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        payment_reference: 'completed_without_payment',
      },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        order_id: orderId,
        status: 'paid',
        note: 'Order completed without payment processing',
      },
    });

    return {
      order_id: orderId,
      status: 'completed',
      message: 'Order completed successfully',
    };
  }
}
