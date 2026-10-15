import { Module } from '@nestjs/common';
import { NotificationsGateway } from './websocket/notfications.gateway.js';
import { NotificationsController } from './notifications/notifications.controller.js';
import { NotificationsService } from './notifications/notifications.service.js';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService],
})
export class AppModule {}
