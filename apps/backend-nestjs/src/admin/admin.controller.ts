import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { OrderStatusUpdateDto } from '../orders/dto/order.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('orders')
  @ApiOperation({ summary: 'List all orders (Admin only)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  async listOrders(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
  ) {
    return this.adminService.getAllOrders(status, page, size);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details (Admin only)' })
  async getOrder(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getOrderDetail(id);
  }

  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrderStatusUpdateDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto);
  }

  @Get('reviews/pending')
  @ApiOperation({ summary: 'List pending reviews (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  async listPendingReviews(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
  ) {
    return this.adminService.getPendingReviews(page, size);
  }

  @Put('reviews/:id/approve')
  @ApiOperation({ summary: 'Approve or reject review (Admin only)' })
  @ApiQuery({ name: 'approved', required: false, type: Boolean })
  async approveReview(
    @Param('id', ParseIntPipe) id: number,
    @Query('approved', new DefaultValuePipe(true)) approved: any,
  ) {
    const isApproved = approved === true || approved === 'true';
    return this.adminService.approveReview(id, isApproved);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics dashboard (Admin only)' })
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
