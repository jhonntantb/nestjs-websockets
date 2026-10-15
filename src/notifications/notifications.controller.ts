import { Body, Controller, Post } from "@nestjs/common";
import { NotificationsService } from "./notifications.service.js";

@Controller('notifications')
export class NotificationsController {

    constructor(private readonly notificationsService: NotificationsService){}

    @Post('notify')
    notify(@Body() body: {title?: string; body?: string; senderId?: string}){
        this.notificationsService.send({
            title: body?.title ?? 'Notification',
            body: body?.body ?? 'New notification',
            senderId: body?.senderId,
        })
    }
}