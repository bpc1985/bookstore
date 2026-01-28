import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private formatCartItem(item: any) {
    return {
      id: item.id,
      book_id: item.book_id,
      quantity: item.quantity,
      added_at: item.added_at,
      expires_at: item.expires_at,
      book: item.book
        ? {
            id: item.book.id,
            title: item.book.title,
            author: item.book.author,
            price: Number(item.book.price),
            stock_quantity: item.book.stock_quantity,
            cover_image: item.book.cover_image,
            rating: Number(item.book.rating),
            review_count: item.book.review_count,
            categories:
              item.book.categories?.map((bc: any) => bc.category) || [],
          }
        : null,
    };
  }

  async getCart(userId: number) {
    const items = await this.prisma.cartItem.findMany({
      where: { user_id: userId },
      include: {
        book: { include: { categories: { include: { category: true } } } },
      },
      orderBy: { added_at: 'desc' },
    });

    const validItems = items.filter((item) => item.book && !item.book.is_deleted);
    let subtotal = 0;
    let totalItems = 0;

    for (const item of validItems) {
      subtotal += Number(item.book.price) * item.quantity;
      totalItems += item.quantity;
    }

    return {
      items: validItems.map((i) => this.formatCartItem(i)),
      total_items: totalItems,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: dto.book_id, is_deleted: false },
    });
    if (!book) throw new NotFoundException('Book not found');

    if (book.stock_quantity < dto.quantity) {
      throw new BadRequestException(
        `Only ${book.stock_quantity} items available`,
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const existing = await this.prisma.cartItem.findUnique({
      where: { uq_user_book: { user_id: userId, book_id: dto.book_id } },
    });

    if (existing) {
      const newQuantity = existing.quantity + dto.quantity;
      if (book.stock_quantity < newQuantity) {
        throw new BadRequestException(
          `Only ${book.stock_quantity} items available`,
        );
      }

      const updated = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity, expires_at: expiresAt },
        include: {
          book: { include: { categories: { include: { category: true } } } },
        },
      });
      return this.formatCartItem(updated);
    }

    const cartItem = await this.prisma.cartItem.create({
      data: {
        user_id: userId,
        book_id: dto.book_id,
        quantity: dto.quantity,
        expires_at: expiresAt,
      },
      include: {
        book: { include: { categories: { include: { category: true } } } },
      },
    });
    return this.formatCartItem(cartItem);
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, user_id: userId },
      include: { book: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (item.book.stock_quantity < dto.quantity) {
      throw new BadRequestException(
        `Only ${item.book.stock_quantity} items available`,
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updated = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity, expires_at: expiresAt },
      include: {
        book: { include: { categories: { include: { category: true } } } },
      },
    });
    return this.formatCartItem(updated);
  }

  async removeItem(userId: number, itemId: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, user_id: userId },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(userId: number) {
    await this.prisma.cartItem.deleteMany({ where: { user_id: userId } });
  }

  async validateCartForCheckout(userId: number) {
    const cart = await this.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of cart.items) {
      const book = await this.prisma.book.findUnique({
        where: { id: item.book_id },
      });
      if (!book || book.stock_quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for '${item.book?.title}'. Available: ${book?.stock_quantity || 0}`,
        );
      }
    }

    return cart;
  }
}
