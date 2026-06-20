import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/tracking' })
export class TrackingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribeOrder')
  subscribeOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ): { subscribed: string } {
    const room = `order:${data.orderId}`;
    client.join(room);
    return { subscribed: room };
  }

  emitLocation(orderId: string, payload: { lat: number; lng: number }): void {
    this.server.to(`order:${orderId}`).emit('locationUpdate', {
      orderId,
      ...payload,
    });
  }
}
