import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { InventoryService } from './inventory.service';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [CartModule],
  controllers: [OrdersController],
  providers: [OrdersService, InventoryService],
  exports: [OrdersService, InventoryService],
})
export class OrdersModule {}
