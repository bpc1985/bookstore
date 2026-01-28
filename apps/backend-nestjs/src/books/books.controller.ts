import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { RecommendationService } from './recommendation.service';
import { CreateBookDto, UpdateBookDto, BookSearchQuery } from './dto/book.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(
    private booksService: BooksService,
    private recommendationService: RecommendationService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List books with filtering and pagination' })
  async findAll(@Query() query: BookSearchQuery) {
    return this.booksService.search(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get book details' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  @Public()
  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Get book recommendations' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecommendations(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.recommendationService.getRecommendations(
      id,
      Math.min(limit, 20),
    );
  }

  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create book (Admin only)' })
  async create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Put(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update book (Admin only)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookDto,
  ) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete book (Admin only)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.booksService.remove(id);
  }
}
