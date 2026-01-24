import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreadCardComponent } from '../../components/thread-card/thread-card';
import { ThreadService } from '../../services/thread';
import { Thread } from '../../types/thread';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    private router: Router,
    private auth: AuthService
  ) {}

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }

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
    this.threadService.likeThread(thread.id).subscribe({
      next: (updated) => {
        if (updated) {
          this.replaceThread(updated);
        }
      },
      error: (err) => {
        console.error('Like failed', err);
        this.handleAuthError(err);
      },
    });
  }

  onDislike(thread: Thread) {
    this.threadService.dislikeThread(thread.id).subscribe({
      next: (updated) => {
        if (updated) {
          this.replaceThread(updated);
        }
      },
      error: (err) => {
        console.error('Dislike failed', err);
        this.handleAuthError(err);
      },
    });
  }

  private handleAuthError(err: any) {
      if (err?.status === 401 || err?.status === 403) {
        this.router.navigate(['/authentication']);
        return true;
      }
      return false;
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
  goThread(thread: Thread) {
    this.router.navigate(['/forum', thread.id]);
  }
}
