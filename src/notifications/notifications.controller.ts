import { Body, Controller, Post } from "@nestjs/common";
import { NotificationsService } from "./notifications.service.js";

@Controller()
export class NotificationsController {

    constructor(private readonly notificationsService: NotificationsService){}

    @Post()
    notify(@Body() body: {title?: string; body?: string}){
        this.notificationsService.send({
            title: body?.title ?? 'Notification',
            body: body?.body ?? 'New notification'
        })
    }
}