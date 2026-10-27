import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

export interface INotification {
    id: string;
    title: string;
    body: string;
    ts: number;
    senderId?: string;
}
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  handleConnection(client: Socket) {
    console.log(`Client ${client.id} connected!`);
  }
    
  broadcast(n: INotification) {
    this.server.emit('notification', n);
  }
}