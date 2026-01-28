import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async checkStock(bookId: number, quantity: number): Promise<boolean> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, is_deleted: false },
    });
    if (!book) throw new NotFoundException('Book not found');
    return book.stock_quantity >= quantity;
  }

  async reserveStock(bookId: number, quantity: number) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, is_deleted: false },
    });
    if (!book) throw new NotFoundException('Book not found');

    if (book.stock_quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for '${book.title}'`,
      );
    }

    await this.prisma.book.update({
      where: { id: bookId },
      data: { stock_quantity: book.stock_quantity - quantity },
    });
  }

  async releaseStock(bookId: number, quantity: number) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });
    if (!book) throw new NotFoundException('Book not found');

    await this.prisma.book.update({
      where: { id: bookId },
      data: { stock_quantity: book.stock_quantity + quantity },
    });
  }
}
