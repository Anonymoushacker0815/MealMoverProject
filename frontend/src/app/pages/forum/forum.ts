import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThreadCardComponent } from '../../components/thread-card/thread-card';
import { ThreadService } from '../../services/thread';
import { Thread } from '../../types/thread';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule, ThreadCardComponent],
  templateUrl: './forum.html',
  styleUrl: './forum.css',
})
export class Forum implements OnInit {
  threads: Thread[] = [];

  isReportModalOpen = false;
  reportTarget: Thread | null = null;
  reportReasonPreset: 'Spam / off-topic' | 'Harassment / inappropriate language' | 'Other' =
    'Spam / off-topic';
  reportReasonOther = '';
  reportErrorMsg: string | null = null;
  isSubmittingReport = false;

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

  onReport(thread: Thread) {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/authentication']);
      return;
    }

    this.reportTarget = thread;
    this.reportReasonPreset = 'Spam / off-topic';
    this.reportReasonOther = '';
    this.reportErrorMsg = null;
    this.isReportModalOpen = true;
  }

  cancelReport() {
    this.isReportModalOpen = false;
    this.reportTarget = null;
    this.reportErrorMsg = null;
    this.isSubmittingReport = false;
  }

  submitReport() {
    if (!this.reportTarget) return;

    const reason =
      this.reportReasonPreset === 'Other'
        ? this.reportReasonOther.trim()
        : this.reportReasonPreset;

    if (!reason) {
      this.reportErrorMsg = 'Please enter a reason.';
      return;
    }

    this.isSubmittingReport = true;
    this.reportErrorMsg = null;

    this.threadService.reportThread(this.reportTarget.id, reason).subscribe({
      next: () => {
        this.isSubmittingReport = false;
        this.isReportModalOpen = false;
        this.reportTarget = null;
      },
      error: (err) => {
        this.isSubmittingReport = false;
        if (err?.status === 409) {
          this.reportErrorMsg = 'You already reported this thread.';
          return;
        }
        console.error('Report failed', err);
        if (!this.handleAuthError(err)) {
          this.reportErrorMsg = 'Report failed.';
        }
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
