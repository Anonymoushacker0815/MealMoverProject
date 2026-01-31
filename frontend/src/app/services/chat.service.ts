import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

export type OrderStatusEvent = {
  orderId: number;
  status: string;
  updatedAt: string;
};

export type ChatMessageEvent = {
  id: string;
  orderId: number;
  senderId: number;
  senderType?: string;
  text: string;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class ChatService {
  private socket?: Socket;
  private joinedOrders = new Set<number>();

  private ensureConnected(): Socket {
    if (this.socket) return this.socket;

    const token = localStorage.getItem('token') || '';

    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      auth: { token }, 
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error', err?.message || err);
      for (const orderId of this.joinedOrders) {
        this.socket?.emit('order:join', { orderId });
      }
    });

    return this.socket;
  }

  joinOrder(orderId: number): void {
    const s = this.ensureConnected();

    const doJoin = () => {
      s.emit('order:join', { orderId }, (ack: any) => {
        if (!ack?.ok) console.warn('[socket] order:join failed', ack);
      });
    };

    if (s.connected) doJoin();
    else s.once('connect', doJoin);
  }

  onOrderStatus(orderId: number): Observable<OrderStatusEvent> {
    const s = this.ensureConnected();

    return new Observable<OrderStatusEvent>((subscriber) => {
      const handler = (evt: any) => {
        if (!evt) return;
        if (Number(evt.orderId) !== Number(orderId)) return;

        subscriber.next({
          orderId: Number(evt.orderId),
          status: String(evt.status ?? ''),
          updatedAt: String(evt.updatedAt ?? new Date().toISOString()),
        });
      };

      s.on('order:status', handler);
      return () => s.off('order:status', handler);
    });
  }

  onChatNew(orderId: number): Observable<ChatMessageEvent> {
    const s = this.ensureConnected();

    return new Observable<ChatMessageEvent>((subscriber) => {
      const handler = (msg: any) => {
        if (!msg) return;
        if (Number(msg.orderId) !== Number(orderId)) return;

        subscriber.next({
          id: String(msg.id),
          orderId: Number(msg.orderId),
          senderId: Number(msg.senderId),
          senderType: msg.senderType ? String(msg.senderType) : undefined,
          text: String(msg.text ?? ''),
          createdAt: String(msg.createdAt ?? new Date().toISOString()),
        });
      };

      s.on('chat:new', handler);
      return () => s.off('chat:new', handler);
    });
  }

  sendChat(orderId: number, text: string, cb?: (ok: boolean, error?: string) => void): void {
    const s = this.ensureConnected();
    
    this.joinOrder(orderId);

    const doSend = () => {
      s.emit('chat:send', { orderId, text }, (ack: any) => {
        if (ack?.ok) cb?.(true);
        else cb?.(false, String(ack?.error ?? 'send failed'));
      });
    };

    if (s.connected) doSend();
    else s.once('connect', doSend);
  }


  disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = undefined;
  }
}
