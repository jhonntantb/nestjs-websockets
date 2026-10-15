import { Injectable } from "@nestjs/common";
import { INotification, NotificationsGateway } from "../websocket/notfications.gateway.js";
import { randomUUID } from "crypto";

@Injectable()
export class NotificationsService {
    constructor( private readonly gateway: NotificationsGateway){}

    send(input: {title: string; body: string}) {
        const notification: INotification = {
            id: randomUUID(),
            title: input.title,
            body: input.body,
            ts: Date.now(),
        };

        this.gateway.broadcast(notification)

    }
}