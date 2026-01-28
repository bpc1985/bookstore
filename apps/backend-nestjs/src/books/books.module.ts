import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { RecommendationService } from './recommendation.service';

@Module({
  controllers: [BooksController],
  providers: [BooksService, RecommendationService],
  exports: [BooksService],
})
export class BooksModule {}
