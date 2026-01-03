import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreadCardComponent } from '../../components/thread-card/thread-card';
import { ThreadService } from '../../services/thread';
import { Thread } from '../../types/thread';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

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
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadThreads();

    this.threadService.refresh$.subscribe(() => {
      this.loadThreads();
    });
  }

  private loadThreads() {
    this.threadService.getThreads().subscribe((threads) => {
      this.threads = threads;
      this.cdr.detectChanges();
    });
  }

  onLike(thread: Thread) {
    // optimistic UI
    const oldLikes = thread.likes;
    thread.likes += 1;
    this.cdr.detectChanges();

    this.threadService.likeThread(thread.id).subscribe({
      next: (updated) => {
        if (updated) {
          this.replaceThread(updated);
        }
        this.threadService.triggerRefresh();
      },
      error: (err) => {
        console.error('Like failed', err);
        thread.likes = oldLikes; 
        this.cdr.detectChanges();
      },
    });
  }

  onDislike(thread: Thread) {
    const oldDislikes = thread.dislikes;
    thread.dislikes += 1;
    this.cdr.detectChanges();

    this.threadService.dislikeThread(thread.id).subscribe({
      next: (updated) => {
        if (updated) {
          this.replaceThread(updated);
        }
        this.threadService.triggerRefresh();
      },
      error: (err) => {
        console.error('Dislike failed', err);
        thread.dislikes = oldDislikes;
        this.cdr.detectChanges();
      },
    });
  }

  private replaceThread(updated: Thread) {
    const idx = this.threads.findIndex(t => t.id === updated.id);
    if (idx !== -1) {
      this.threads[idx] = updated;
      this.cdr.detectChanges();
    }
  }

  goNewThread() {
    this.router.navigate(['/forum/new']);
  }
}
