import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

import { ThreadService } from '../../../services/thread';
import { Thread } from '../../../types/thread';
import { Reply } from '../../../types/reply';

@Component({
  standalone: true,
  selector: 'app-thread-detail',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './thread-detail.html',
})
export class ThreadDetailComponent {
  threadId: string;

  thread: Thread | null = null;
  replies: Reply[] = [];

  replyForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private threadService: ThreadService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.threadId = this.route.snapshot.paramMap.get('id') ?? '';

    this.replyForm = this.fb.group({
      content: ['', [Validators.required]],
    });

    this.loadThread();
    this.loadReplies();
  }

  back() {
    this.router.navigate(['/forum']);
  }

  // Optional: Like/Dislike on the thread detail page
  onLike() {
    if (!this.thread) return;

    const oldLikes = this.thread.likes;
    this.thread.likes += 1;
    this.cdr.detectChanges();

    this.threadService.likeThread(this.thread.id).subscribe({
      next: (updated) => {
        if (updated) {
          this.thread = updated;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Like failed', err);
        if (this.thread) this.thread.likes = oldLikes;
        this.cdr.detectChanges();
      },
    });
  }

  onDislike() {
    if (!this.thread) return;

    const oldDislikes = this.thread.dislikes;
    this.thread.dislikes += 1;
    this.cdr.detectChanges();

    this.threadService.dislikeThread(this.thread.id).subscribe({
      next: (updated) => {
        if (updated) {
          this.thread = updated;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Dislike failed', err);
        if (this.thread) this.thread.dislikes = oldDislikes;
        this.cdr.detectChanges();
      },
    });
  }

  submitReply() {
    if (this.replyForm.invalid || this.isSubmitting) {
      this.replyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const payload = {
      content: this.replyForm.value.content ?? '',
      author_name: 'Anonymous', // später: aus Auth/User nehmen
    };

    this.threadService.createReply(this.threadId, payload).subscribe({
      next: (newReply) => {
        // sofort oben anzeigen (weil backend auch DESC sortiert)
        this.replies = [newReply, ...this.replies];
        this.replyForm.reset();
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to create reply', err);
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadThread() {
    if (!this.threadId) return;

    this.threadService.getThread(this.threadId).subscribe({
      next: (thread) => {
        this.thread = thread;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load thread', err);
      },
    });
  }

  private loadReplies() {
    if (!this.threadId) return;

    this.threadService.getReplies(this.threadId).subscribe({
      next: (replies) => {
        this.replies = replies;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load replies', err);
      },
    });
  }
}
