import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  private formatBookList(book: any) {
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      price: Number(book.price),
      stock_quantity: book.stock_quantity,
      cover_image: book.cover_image,
      rating: Number(book.rating),
      review_count: book.review_count,
      categories: book.categories?.map((bc: any) => bc.category) || [],
    };
  }

  async getRecommendations(bookId: number, limit: number = 5) {
    // Step 1: Co-purchased books (also-bought)
    const ordersWithBook = await this.prisma.orderItem.findMany({
      where: { book_id: bookId },
      select: { order_id: true },
    });

    const orderIds = ordersWithBook.map((oi) => oi.order_id);

    if (orderIds.length > 0) {
      const coPurchased = await this.prisma.orderItem.groupBy({
        by: ['book_id'],
        where: {
          order_id: { in: orderIds },
          book_id: { not: bookId },
        },
        _count: { book_id: true },
        orderBy: { _count: { book_id: 'desc' } },
        take: limit,
      });

      if (coPurchased.length > 0) {
        const bookIds = coPurchased.map((cp) => cp.book_id);
        const books = await this.prisma.book.findMany({
          where: { id: { in: bookIds }, is_deleted: false },
          include: { categories: { include: { category: true } } },
        });
        return books.map((b) => this.formatBookList(b));
      }
    }

    // Step 2: Category-based fallback
    return this.getCategoryRecommendations(bookId, limit);
  }

  private async getCategoryRecommendations(bookId: number, limit: number) {
    const bookCategories = await this.prisma.bookCategory.findMany({
      where: { book_id: bookId },
      select: { category_id: true },
    });

    const categoryIds = bookCategories.map((bc) => bc.category_id);

    if (categoryIds.length === 0) {
      return this.getPopularBooks(limit);
    }

    const books = await this.prisma.book.findMany({
      where: {
        id: { not: bookId },
        is_deleted: false,
        categories: { some: { category_id: { in: categoryIds } } },
      },
      include: { categories: { include: { category: true } } },
      orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
      take: limit,
    });

    if (books.length === 0) {
      return this.getPopularBooks(limit);
    }

    return books.map((b) => this.formatBookList(b));
  }

  private async getPopularBooks(limit: number) {
    const books = await this.prisma.book.findMany({
      where: { is_deleted: false },
      include: { categories: { include: { category: true } } },
      orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
      take: limit,
    });
    return books.map((b) => this.formatBookList(b));
  }
}
