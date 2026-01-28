import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { ReviewsService } from '../reviews/reviews.service';
import { OrderStatusUpdateDto } from '../orders/dto/order.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private reviewsService: ReviewsService,
  ) {}

  async getAllOrders(status?: string, page: number = 1, size: number = 20) {
    return this.ordersService.getAllOrders(status, page, size);
  }

  async getOrderDetail(orderId: number) {
    return this.ordersService.getOrderDetail(orderId);
  }

  async updateOrderStatus(orderId: number, dto: OrderStatusUpdateDto) {
    return this.ordersService.updateOrderStatus(orderId, dto);
  }

  async getPendingReviews(page: number = 1, size: number = 20) {
    return this.reviewsService.getPendingReviews(page, size);
  }

  async approveReview(reviewId: number, approved: boolean) {
    return this.reviewsService.approveReview(reviewId, approved);
  }

  async getAnalytics() {
    const [totalOrders, pendingOrders, totalBooks, totalUsers, totalReviews] =
      await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: 'pending' } }),
        this.prisma.book.count({ where: { is_deleted: false } }),
        this.prisma.user.count(),
        this.prisma.review.count(),
      ]);

    const revenueResult = await this.prisma.order.aggregate({
      where: { status: { in: ['paid', 'shipped', 'completed'] } },
      _sum: { total_amount: true },
    });

    return {
      total_orders: totalOrders,
      total_revenue: Number(revenueResult._sum.total_amount || 0),
      pending_orders: pendingOrders,
      total_books: totalBooks,
      total_users: totalUsers,
      total_reviews: totalReviews,
    };
  }
}
