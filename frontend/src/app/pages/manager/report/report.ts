import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

interface ReportStatsResponse {
  periodDays: number;
  pendingRestaurants: number;
  totals: {
    total_logins: number;
    new_registrations: number;
    status_changes: number;
    active_users: number;
  };
  trend: { label: string; logins: number }[];
}

interface UserStatsSnapshot {
  totalLogins: number | null;
  newRegistrations: number | null;
  statusChanges: number | null;
  activeUsers: number | null;
  pendingRestaurants: number | null;

  trend: number[];
  trendLabels: string[];
}

@Component({
  selector: 'app-manager-report',
  standalone: true,
  imports: [Navbar],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class ManagerReport implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  errorMsg: string | null = null;

  stats: UserStatsSnapshot = {
    totalLogins: null,
    newRegistrations: null,
    statusChanges: null,
    activeUsers: null,
    pendingRestaurants: null,
    trend: [],
    trendLabels: [],
  };

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.isLoading = true;
    this.errorMsg = null;

    this.http
      .get<ReportStatsResponse>(
        'http://localhost:3000/moderation/report-stats',
        this.getAuthHeaders()
      )
      .subscribe({
        next: (res) => {
          const trendRows = res?.trend ?? [];

          this.stats = {
            totalLogins: res?.totals?.total_logins ?? 0,
            newRegistrations: res?.totals?.new_registrations ?? 0,
            statusChanges: res?.totals?.status_changes ?? 0,
            activeUsers: res?.totals?.active_users ?? 0,
            pendingRestaurants: res?.pendingRestaurants ?? 0,
            trend: trendRows.map((x) => x.logins),
            trendLabels: trendRows.map((x) => x.label),
          };

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          if (this.handleAuthError(err)) return;
          console.error(err);
          this.errorMsg = 'Failed to load statistics';
          this.cdr.detectChanges();
        },
      });
  }

  get trendPoints(): string {
    const w = 520;
    const h = 120;
    const pad = 12;

    const data = this.stats.trend ?? [];
    if (data.length === 0) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = Math.max(1, max - min);

    return data
      .map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
        const y = pad + (1 - (v - min) / span) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  get trendSvgWidth(): number {
    return 520; // keep your internal coordinate system
  }

  get trendSvgHeight(): number {
    return 160; // slightly taller to fit labels
  }

  get trendLabelTicks(): { x: number; label: string }[] {
    const w = this.trendSvgWidth;
    const pad = 12;

    const labels = this.stats.trendLabels ?? [];
    const n = labels.length;
    if (n === 0) return [];

    return labels.map((label, i) => {
      const x = pad + (i * (w - pad * 2)) / Math.max(1, n - 1);
      return { x, label };
    });
  }

  get trendMinMaxLabel(): string {
    const data = this.stats.trend ?? [];
    if (data.length === 0) return '';
    return `${Math.min(...data)}–${Math.max(...data)}`;
  }

  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return { headers: new HttpHeaders({ Authorization: token }) };
  }

  private handleAuthError(err: any) {
    if (err?.status === 401 || err?.status === 403) {
      this.router.navigate(['/authentication']);
      return true;
    }
    return false;
  }
}
