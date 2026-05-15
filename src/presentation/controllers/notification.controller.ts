import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ListNotificationsByOrderUseCase } from '../../application/use-cases/list-notifications-by-order.use-case';
import { ListNotificationsByCustomerUseCase } from '../../application/use-cases/list-notifications-by-customer.use-case';
import { RetryNotificationUseCase } from '../../application/use-cases/retry-notification.use-case';
import { NotificationResponseDto } from '../dtos/notification-response.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly listByOrder: ListNotificationsByOrderUseCase,
    private readonly listByCustomer: ListNotificationsByCustomerUseCase,
    private readonly retry: RetryNotificationUseCase,
  ) {}

  @Get('order/:orderId')
  @ApiOperation({ summary: 'List all notifications sent for a specific order' })
  @ApiParam({ name: 'orderId', type: String })
  async getByOrder(
    @Param('orderId') orderId: string,
  ): Promise<NotificationResponseDto[]> {
    return this.listByOrder.execute(orderId) as Promise<
      NotificationResponseDto[]
    >;
  }

  @Get('customer/:cpf')
  @ApiOperation({
    summary: 'List all notifications sent to a specific customer',
  })
  @ApiParam({ name: 'cpf', type: String })
  async getByCustomer(
    @Param('cpf') cpf: string,
  ): Promise<NotificationResponseDto[]> {
    return this.listByCustomer.execute(cpf) as Promise<
      NotificationResponseDto[]
    >;
  }

  @Post('retry/:id')
  @ApiOperation({ summary: 'Manually retry a failed notification' })
  @ApiParam({ name: 'id', type: String })
  async retryNotification(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.retry.execute(id);
    return { message: 'Retry triggered successfully' };
  }
}
