import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { InventoryService } from './inventory.service';
import { CreateOrderDto, OrderStatusUpdateDto } from './dto/order.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed'],
  cancelled: [],
  completed: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private inventoryService: InventoryService,
  ) {}

  private formatOrderDetail(order: any) {
    return {
      id: order.id,
      user_id: order.user_id,
      status: order.status,
      total_amount: Number(order.total_amount),
      shipping_address: order.shipping_address,
      payment_reference: order.payment_reference,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: order.items.map((item: any) => ({
        id: item.id,
        book_id: item.book_id,
        quantity: item.quantity,
        price_at_purchase: Number(item.price_at_purchase),
        book_title: item.book?.title || null,
        book_author: item.book?.author || null,
      })),
      status_history: order.status_history?.sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ) || [],
    };
  }

  private formatOrderList(order: any) {
    return {
      id: order.id,
      status: order.status,
      total_amount: Number(order.total_amount),
      created_at: order.created_at,
      item_count: order.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      ),
    };
  }

  async createOrder(userId: number, dto: CreateOrderDto) {
    const cart = await this.cartService.validateCartForCheckout(userId);

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          total_amount: new Prisma.Decimal(cart.subtotal),
          shipping_address: dto.shipping_address,
          status: 'pending',
        },
      });

      for (const cartItem of cart.items) {
        // Reserve stock within the transaction to avoid SQLite lock conflicts
        const book = await tx.book.findFirst({
          where: { id: cartItem.book_id, is_deleted: false },
        });
        if (!book) {
          throw new BadRequestException(`Book not found: ${cartItem.book_id}`);
        }
        if (book.stock_quantity < cartItem.quantity) {
          throw new BadRequestException(
            `Insufficient stock for '${book.title}'`,
          );
        }
        await tx.book.update({
          where: { id: cartItem.book_id },
          data: { stock_quantity: book.stock_quantity - cartItem.quantity },
        });

        await tx.orderItem.create({
          data: {
            order_id: newOrder.id,
            book_id: cartItem.book_id,
            quantity: cartItem.quantity,
            price_at_purchase: cartItem.book?.price || 0,
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          order_id: newOrder.id,
          status: 'pending',
          note: 'Order created',
        },
      });

      return newOrder;
    });

    await this.cartService.clearCart(userId);

    return this.getOrderDetail(order.id);
  }

  async getUserOrders(
    userId: number,
    status?: string,
    page: number = 1,
    size: number = 20,
  ) {
    const where: any = { user_id: userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.order.count({ where }),
    ]);

    return PaginatedResponse.create(
      orders.map((o) => this.formatOrderList(o)),
      total,
      page,
      size,
    );
  }

  async getOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
      include: {
        items: { include: { book: true } },
        status_history: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.formatOrderDetail(order);
  }

  async getOrderDetail(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { book: true } },
        status_history: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.formatOrderDetail(order);
  }

  async getOrderTracking(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
      include: { status_history: { orderBy: { created_at: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order.status_history;
  }

  async cancelOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== 'pending') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    // Release stock and update order in sequence (no nested transactions needed)
    for (const item of order.items) {
      await this.inventoryService.releaseStock(item.book_id, item.quantity);
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        order_id: orderId,
        status: 'cancelled',
        note: 'Cancelled by user',
      },
    });

    return this.getOrderDetail(orderId);
  }

  async updateOrderStatus(orderId: number, dto: OrderStatusUpdateDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    if (
      dto.status === 'cancelled' &&
      (order.status === 'pending' || order.status === 'paid')
    ) {
      for (const item of order.items) {
        await this.inventoryService.releaseStock(item.book_id, item.quantity);
      }
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        order_id: orderId,
        status: dto.status,
        note: dto.note || null,
      },
    });

    return this.getOrderDetail(orderId);
  }

  async getAllOrders(status?: string, page: number = 1, size: number = 20) {
    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.order.count({ where }),
    ]);

    return PaginatedResponse.create(
      orders.map((o) => this.formatOrderList(o)),
      total,
      page,
      size,
    );
  }
}
