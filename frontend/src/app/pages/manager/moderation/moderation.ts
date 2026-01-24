import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Navbar } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth.service';
import { ThreadReport } from '../../../types/thread-report';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './moderation.html',
  styleUrl: './moderation.css',
})
export class ManagerModeration implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  reports: ThreadReport[] = [];
  isLoading = false;
  errorMsg: string | null = null;

  ngOnInit() {
    this.loadOpenReports();
  }

  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return {
      headers: new HttpHeaders({
        Authorization: token,
      }),
    };
  }

  loadOpenReports() {
    this.isLoading = true;
    this.errorMsg = null;

    this.http
      .get<ThreadReport[]>(
        'http://localhost:3000/moderation/thread-reports?status=open',
        this.getAuthHeaders()
      )
      .subscribe({
        next: (rows) => {
          console.log('loaded reports', rows);
          this.reports = rows ?? [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          if (this.handleAuthError(err)) return;
          console.error(err);
          this.errorMsg = 'Failed to load reports';
          this.cdr.detectChanges();
        },
      });
  }

  dismiss(report: ThreadReport) {
    this.updateStatus(report, 'dismissed');
  }

  action(report: ThreadReport) {
    this.updateStatus(report, 'actioned');
  }

  private updateStatus(report: ThreadReport, status: 'dismissed' | 'actioned') {
    this.http
      .patch<ThreadReport>(
        `http://localhost:3000/moderation/thread-reports/${report.id}`,
        { status, resolution_note: null },
        this.getAuthHeaders()
      )
      .subscribe({
        next: () => {
          this.reports = this.reports.filter((r) => r.id !== report.id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (this.handleAuthError(err)) return;
          console.error(err);
          this.errorMsg = 'Failed to update report';
          this.cdr.detectChanges();
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
}
