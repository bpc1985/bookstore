import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  private async hasPurchasedBook(
    userId: number,
    bookId: number,
  ): Promise<boolean> {
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        book_id: bookId,
        order: {
          user_id: userId,
          status: { in: ['paid', 'shipped', 'completed'] },
        },
      },
    });
    return !!orderItem;
  }

  private async updateBookRating(bookId: number) {
    const result = await this.prisma.review.aggregate({
      where: { book_id: bookId, is_approved: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.book.update({
      where: { id: bookId },
      data: {
        rating: result._avg.rating || 0,
        review_count: result._count.id,
      },
    });
  }

  async createReview(userId: number, bookId: number, dto: CreateReviewDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, is_deleted: false },
    });
    if (!book) throw new NotFoundException('Book not found');

    const existing = await this.prisma.review.findUnique({
      where: { uq_user_book_review: { user_id: userId, book_id: bookId } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this book');
    }

    const isVerified = await this.hasPurchasedBook(userId, bookId);

    const review = await this.prisma.review.create({
      data: {
        user_id: userId,
        book_id: bookId,
        rating: dto.rating,
        comment: dto.comment || null,
        is_verified_purchase: isVerified,
        is_approved: true,
      },
      include: { user: { select: { id: true, full_name: true } } },
    });

    await this.updateBookRating(bookId);

    return this.formatReviewResponse(review);
  }

  async getBookReviews(bookId: number, page: number = 1, size: number = 20) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, is_deleted: false },
    });
    if (!book) throw new NotFoundException('Book not found');

    const where = { book_id: bookId, is_approved: true };
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: { select: { id: true, full_name: true } } },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.review.count({ where }),
    ]);

    const items = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      is_verified_purchase: r.is_verified_purchase,
      created_at: r.created_at,
      reviewer_name: r.user?.full_name || 'Anonymous',
    }));

    return PaginatedResponse.create(items, total, page, size);
  }

  async updateReview(userId: number, reviewId: number, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');

    if (review.user_id !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    const data: any = {};
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.comment !== undefined) data.comment = dto.comment;

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data,
      include: { user: { select: { id: true, full_name: true } } },
    });

    await this.updateBookRating(review.book_id);

    return this.formatReviewResponse(updated);
  }

  async deleteReview(userId: number, reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');

    if (review.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const bookId = review.book_id;
    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.updateBookRating(bookId);
  }

  async approveReview(reviewId: number, approved: boolean = true) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { is_approved: approved },
      include: { user: { select: { id: true, full_name: true } } },
    });

    await this.updateBookRating(review.book_id);

    return this.formatReviewResponse(updated);
  }

  async getPendingReviews(page: number = 1, size: number = 20) {
    const where = { is_approved: false };
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: { select: { id: true, full_name: true } } },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.review.count({ where }),
    ]);

    return PaginatedResponse.create(
      reviews.map((r) => this.formatReviewResponse(r)),
      total,
      page,
      size,
    );
  }

  private formatReviewResponse(review: any) {
    return {
      id: review.id,
      user_id: review.user_id,
      book_id: review.book_id,
      rating: review.rating,
      comment: review.comment,
      is_verified_purchase: review.is_verified_purchase,
      is_approved: review.is_approved,
      created_at: review.created_at,
      updated_at: review.updated_at,
      reviewer: review.user
        ? { id: review.user.id, full_name: review.user.full_name }
        : null,
    };
  }
}
