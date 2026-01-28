import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { OrdersModule } from '../orders/orders.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [OrdersModule, ReviewsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
