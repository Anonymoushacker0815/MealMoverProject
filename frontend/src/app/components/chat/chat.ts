import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})

export class Chat implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private sub?: Subscription;

  @Input({ required: true }) orderId!: number;

  messages = signal<Array<{ id: string; senderId: number; text: string; createdAt: string }>>([]);
  draft = '';

  ngOnInit(): void {
    this.chatService.joinOrder(this.orderId);

    this.sub = this.chatService.onChatNew(this.orderId).subscribe((m) => {
      this.messages.update((arr) => [
        ...arr,
        { id: m.id, senderId: m.senderId, text: m.text, createdAt: m.createdAt },
      ]);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get myUserId(): number | null {
    const u = this.authService.currentUser();
    const id = Number(u?.id);
    return Number.isFinite(id) ? id : null;
  }

  send(): void {
    const text = this.draft.trim();
    if (!text) return;

    this.chatService.sendChat(this.orderId, text, (ok) => {
      if (ok) this.draft = '';
    });
  }
}

