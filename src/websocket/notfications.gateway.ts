import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

export interface INotification {
    id: string;
    title: string;
    body: string;
    ts: number;
}
@WebSocketGateway()
export class NotificationsGateway implements OnGatewayConnection {
    @WebSocketServer() server!: Server
    handleConnection(client: Socket) {
        console.log(`Client ${client.id} connectec!`)
    }
    
    broadcast(n: INotification) {
        this.server.emit('notification', n);
    }
}