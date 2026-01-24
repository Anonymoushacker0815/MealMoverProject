import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Thread } from '../../types/thread';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-thread-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './thread-card.html',
  styleUrl: './thread-card.css',
})
export class ThreadCardComponent {
  private auth = inject(AuthService);

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }
  @Input({ required: true }) thread!: Thread;

  @Output() like = new EventEmitter<Thread>();
  @Output() dislike = new EventEmitter<Thread>();
  @Output() comment = new EventEmitter<Thread>();
  @Output() report = new EventEmitter<Thread>();
  @Output() open = new EventEmitter<Thread>();
}
