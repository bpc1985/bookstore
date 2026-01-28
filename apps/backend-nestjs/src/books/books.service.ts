import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto, BookSearchQuery } from './dto/book.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  private formatBook(book: any) {
    return {
      ...book,
      price: Number(book.price),
      rating: Number(book.rating),
      categories: book.categories?.map((bc: any) => bc.category) || [],
    };
  }

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

  async search(query: BookSearchQuery) {
    const page = query.page || 1;
    const size = Math.min(query.size || 20, 100);
    const offset = (page - 1) * size;

    const where: any = { is_deleted: false };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { author: { contains: query.search } },
      ];
    }

    if (query.category_id) {
      where.categories = {
        some: { category_id: query.category_id },
      };
    }

    if (query.min_price !== undefined) {
      where.price = { ...(where.price || {}), gte: query.min_price };
    }
    if (query.max_price !== undefined) {
      where.price = { ...(where.price || {}), lte: query.max_price };
    }

    if (query.in_stock === true) {
      where.stock_quantity = { gt: 0 };
    }

    const sortField = query.sort_by || 'created_at';
    const sortOrder = query.sort_order === 'asc' ? 'asc' : 'desc';
    const orderBy: any = { [sortField]: sortOrder };

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        include: { categories: { include: { category: true } } },
        orderBy,
        skip: offset,
        take: size,
      }),
      this.prisma.book.count({ where }),
    ]);

    return PaginatedResponse.create(
      books.map((b) => this.formatBookList(b)),
      total,
      page,
      size,
    );
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findFirst({
      where: { id, is_deleted: false },
      include: { categories: { include: { category: true } } },
    });
    if (!book) throw new NotFoundException('Book not found');
    return this.formatBook(book);
  }

  async create(dto: CreateBookDto) {
    const existing = await this.prisma.book.findUnique({
      where: { isbn: dto.isbn },
    });
    if (existing) {
      throw new ConflictException('Book with this ISBN already exists');
    }

    const { category_ids, ...bookData } = dto;
    const book = await this.prisma.book.create({
      data: {
        ...bookData,
        price: new Prisma.Decimal(dto.price),
        categories: {
          create: category_ids.map((cid) => ({ category_id: cid })),
        },
      },
      include: { categories: { include: { category: true } } },
    });

    return this.formatBook(book);
  }

  async update(id: number, dto: UpdateBookDto) {
    const book = await this.prisma.book.findFirst({
      where: { id, is_deleted: false },
    });
    if (!book) throw new NotFoundException('Book not found');

    const { category_ids, ...updateData } = dto;
    const data: any = { ...updateData };
    if (dto.price !== undefined) {
      data.price = new Prisma.Decimal(dto.price);
    }

    if (category_ids !== undefined) {
      await this.prisma.bookCategory.deleteMany({ where: { book_id: id } });
      data.categories = {
        create: category_ids.map((cid) => ({ category_id: cid })),
      };
    }

    const updated = await this.prisma.book.update({
      where: { id },
      data,
      include: { categories: { include: { category: true } } },
    });

    return this.formatBook(updated);
  }

  async remove(id: number) {
    const book = await this.prisma.book.findFirst({
      where: { id, is_deleted: false },
    });
    if (!book) throw new NotFoundException('Book not found');

    await this.prisma.book.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}
