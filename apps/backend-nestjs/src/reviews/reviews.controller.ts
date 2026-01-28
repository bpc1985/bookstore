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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post('books/:bookId/reviews')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review for a book' })
  async create(
    @CurrentUser() user: any,
    @Param('bookId', ParseIntPipe) bookId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.id, bookId, dto);
  }

  @Public()
  @Get('books/:bookId/reviews')
  @ApiOperation({ summary: 'Get reviews for a book' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  async getBookReviews(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
  ) {
    return this.reviewsService.getBookReviews(bookId, page, size);
  }

  @Put('reviews/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(user.id, id, dto);
  }

  @Delete('reviews/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  async remove(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.reviewsService.deleteReview(user.id, id);
  }
}
