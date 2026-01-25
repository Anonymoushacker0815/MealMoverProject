import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartOptions,
  registerables,
} from 'chart.js';

// Chart.js initialisieren
Chart.register(...registerables);


// Tageswert für Monatsdiagramm
type MonthlyPoint = { day: number; value: number };

// Beliebteste Gerichte
type PopularItem = {
  name: string;
  sold: number;
  revenue: number;
};

// Review-Übersicht
type Review = {
  id: number;
  orderId: string;
  date: string;
  rating: number;
};

// Review-Detailansicht
type ReviewDetails = {
  id: number;
  rating: number;
  details: string;
  user_id: number;
  username: string;
  dish_id: number | null;
  dish_name: string | null;
};

@Component({
  standalone: true,
  selector: 'app-owner-analytics',
  imports: [CommonModule, Navbar, BaseChartDirective],
  templateUrl: './analytics.html',
})
export class OwnerAnalytics implements OnInit {

  // Angular Services
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // Backend Basis-URL
  private API = 'http://localhost:3000';

  // Ladezustand
  isLoading = false;

  // Aktuell ausgewählter Monat / Jahr
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  // Analytics-Daten
  orderCounts = { day: 0, week: 0, month: 0 };
  monthly: MonthlyPoint[] = [];
  items: PopularItem[] = [];
  reviews: Review[] = [];

  // Review-Modal Status
  isReviewModalOpen = false;
  isReviewLoading = false;
  selectedReview: ReviewDetails | null = null;


  // Initiales Laden der Analytics
  ngOnInit() {
    this.loadAnalytics();
  }


  // Authorization Header
  private headers() {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }


  // Anzeige-Label für aktuellen Monat
  get monthLabel(): string {
    return new Date(this.currentYear, this.currentMonth - 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }


  // Zum vorherigen Monat wechseln
  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 1) {
      this.currentMonth = 12;
      this.currentYear--;
    }
    this.loadAnalytics();
  }


  // Zum nächsten Monat wechseln
  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    }
    this.loadAnalytics();
  }


  // Sortierte Liste der beliebtesten Gerichte
  get popularItems(): PopularItem[] {
    return [...this.items].sort((a, b) => b.sold - a.sold);
  }


  // Chart-Daten
  public monthlyChartData: ChartData<'line'> = { labels: [], datasets: [] };


  // Chart-Konfiguration
  public monthlyChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        title: { display: true, text: 'Orders' },
        ticks: { precision: 0 },
        grid: { color: 'rgba(0,0,0,0.12)' },
      },
      x: {
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: { display: false },
      },
    },
  };

  // Chart-Typ
  public monthlyChartType: ChartConfiguration<'line'>['type'] = 'line';


  // Baut das Monatsdiagramm neu auf
  private rebuildChart() {
    this.monthlyChartData = {
      labels: this.monthly.map((m) => m.day.toString()),
      datasets: [
        {
          label: 'Orders',
          data: this.monthly.map((m) => m.value),
          borderColor: '#111111',
          backgroundColor: 'transparent',
          pointBackgroundColor: '#111111',
          pointBorderColor: '#111111',
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0,
        },
      ],
    };
    this.cdr.detectChanges();
  }


  // Lädt alle Analytics-Daten vom Backend
  loadAnalytics() {
    this.isLoading = true;
    this.cdr.detectChanges();

    const url = `${this.API}/owner/analytics?year=${this.currentYear}&month=${this.currentMonth}`;

    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: (res) => {

        // Monat/Jahr ggf. vom Backend korrigieren
        if (res?.selected?.year && res?.selected?.month) {
          this.currentYear = Number(res.selected.year);
          this.currentMonth = Number(res.selected.month);
        }

        // Zähler
        this.orderCounts = res.orderCounts ?? { day: 0, week: 0, month: 0 };

        // Monatsdiagramm
        this.monthly = (res.monthly ?? []).map((x: any) => ({
          day: Number(x.day),
          value: Number(x.value),
        }));

        // Beliebteste Gerichte
        this.items = (res.items ?? []).map((x: any) => ({
          name: x.name,
          sold: Number(x.sold ?? 0),
          revenue: Number(x.revenue ?? 0),
        }));

        // Reviews
        this.reviews = (res.reviews ?? []).map((r: any) => ({
          id: Number(r.id),
          orderId: r.orderId,
          date: r.date ?? '',
          rating: Number(r.rating ?? 0),
        }));

        this.rebuildChart();

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('LOAD /owner/analytics ERROR', err);
        this.isLoading = false;
        this.cdr.detectChanges();

        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
        }
        alert(err.error?.error || 'Failed to load analytics');
      },
    });
  }


  // Öffnet Review-Modal und lädt Details
  viewReview(r: Review) {
    this.isReviewModalOpen = true;
    this.isReviewLoading = true;
    this.selectedReview = null;
    this.cdr.detectChanges();

    this.http.get<any>(`${this.API}/owner/reviews/${r.id}`, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.selectedReview = res.review as ReviewDetails;
        this.isReviewLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('LOAD /owner/reviews/:id ERROR', err);
        this.isReviewLoading = false;
        this.cdr.detectChanges();
        alert(err.error?.error || 'Failed to load review details');
      },
    });
  }


  // Schließt das Review-Modal
  closeReviewModal() {
    this.isReviewModalOpen = false;
    this.isReviewLoading = false;
    this.selectedReview = null;
    this.cdr.detectChanges();
  }


  // Review melden (Placeholder)
  reportReview(r: Review) {
    alert(`Report review ${r.orderId}`);
  }
}
