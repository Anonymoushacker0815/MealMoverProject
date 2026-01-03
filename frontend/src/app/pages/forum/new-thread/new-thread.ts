import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ThreadService } from '../../../services/thread';


@Component({
  standalone: true,
  selector: 'app-new-thread',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-thread.html',
})
export class NewThreadComponent {
  threadForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private threadService: ThreadService
  ) {
    this.threadForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
    });
  }

  submit() {
    if (this.threadForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    this.threadService.createThread(this.threadForm.value).subscribe({
      next: () => {
        this.threadService.triggerRefresh();
        this.router.navigate(['/forum']);
      },
      error: (err) => {
        console.error('Failed to create thread', err);
        this.isSubmitting = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/forum']);
  }
}
