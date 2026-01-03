import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreadCardComponent } from '../../components/thread-card/thread-card';
import { ThreadService } from '../../services/thread';
import { Thread } from '../../types/thread';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, ThreadCardComponent],
  templateUrl: './forum.html',
  styleUrl: './forum.css',
})
export class Forum implements OnInit {
  threads: Thread[] = [];

  constructor(
    private threadService: ThreadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.threadService.getThreads().subscribe((threads) => {
      this.threads = threads;
      this.cdr.detectChanges(); // 🔥 DAS ist der Schlüssel
    });
  }
}
