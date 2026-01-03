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

  goNewThread() {
    this.router.navigate(['/forum/new']);
  }
}
