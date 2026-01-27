// ANGULAR CORE & LIFECYCLE
// Basisfunktionen für Komponenten, Lifecycle und Dependency Injection
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';

// ANGULAR COMMON MODULES
// Grundlegende Direktiven und Formularunterstützung
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// UI COMPONENTS
// Navbar-Komponente für die Owner-Navigation
import { Navbar } from '../../../components/navbar/navbar';

// HTTP & AUTH SERVICES
// HttpClient und HttpHeaders für API-Calls, AuthService für Logout bei Token-Problemen
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

// CHARTS INTEGRATION
// ng2-charts Directive und Chart.js Setup für das Monatsdiagramm
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartOptions, registerables } from 'chart.js';

Chart.register(...registerables);


// MONTHLY POINT MODEL
// Datenmodell für Tageswerte im Monatsdiagramm
type MonthlyPoint = { day: number; value: number };

// POPULAR ITEM MODEL
// Datenmodell für beliebte Gerichte inklusive Umsatz
type PopularItem = { name: string; sold: number; revenue: number };

// REVIEW LIST MODEL
// Datenmodell für die Review-Liste im Table-View
type Review = { id: number; orderId: string; date: string; rating: number };

// REVIEW DETAILS MODEL
// Datenmodell für Detailinformationen im Review-Modal
type ReviewDetails = {
  id: number;
  rating: number;
  details: string;
  user_id: number;
  username: string;
  dish_id: number | null;
  dish_name: string | null;
  created_at?: string;
};


// COMPONENT DEFINITION
// Standalone-Komponente für Analytics im Owner-Bereich
@Component({
  standalone: true,
  selector: 'app-owner-analytics',
  imports: [CommonModule, Navbar, FormsModule, BaseChartDirective],
  templateUrl: './analytics.html',
})
export class OwnerAnalytics implements OnInit {

  // SERVICE INJECTIONS
  // HTTP für API-Aufrufe, AuthService für Session-Handling, ChangeDetector für UI-Updates
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // BACKEND CONFIG
  // Basis-URL für Owner Analytics Endpoints
  private API = 'http://localhost:3000';

  // LOADING STATE
  // Zeigt an ob Analytics gerade geladen werden
  isLoading = false;

  // MONTH SELECTION STATE
  // Aktuell ausgewählter Monat und Jahr für das Diagramm
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  // ANALYTICS STATE
  // Speichert Counts, Monatswerte, Popular Items und Reviews aus dem Backend
  orderCounts = { day: 0, week: 0, month: 0 };
  monthly: MonthlyPoint[] = [];
  items: PopularItem[] = [];
  reviews: Review[] = [];

  // REVIEW MODAL STATE
  // Zustand und Daten für Review-Details Modal
  isReviewModalOpen = false;
  isReviewLoading = false;
  selectedReview: ReviewDetails | null = null;

  // REPORT MODAL STATE
  // Zustand und Daten für das Report-Modal
  isReportModalOpen = false;
  isReportSending = false;
  reportText = '';
  reportTarget: Review | null = null;

  // LIFECYCLE HOOK
  // Lädt die Analytics-Daten beim Start der Komponente
  ngOnInit() {
    this.loadAnalytics();
  }

  // AUTH HEADER HELPER
  // Erstellt Authorization Header mit Token aus dem localStorage
  private headers() {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }

  // MONTH LABEL
  // Erzeugt ein Monatslabel für die UI basierend auf currentYear und currentMonth
  get monthLabel(): string {
    return new Date(this.currentYear, this.currentMonth - 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  // MONTH NAVIGATION
  // Wechselt zum vorherigen Monat und lädt Daten neu
  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 1) {
      this.currentMonth = 12;
      this.currentYear--;
    }
    this.loadAnalytics();
  }

  // MONTH NAVIGATION
  // Wechselt zum nächsten Monat und lädt Daten neu
  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    }
    this.loadAnalytics();
  }

  // POPULAR ITEMS SORT
  // Liefert eine sortierte Kopie der Popular Items nach Verkaufsmengen
  get popularItems(): PopularItem[] {
    return [...this.items].sort((a, b) => b.sold - a.sold);
  }

  // CHART STATE
  // Datencontainer für das ChartJS Liniendiagramm
  public monthlyChartData: ChartData<'line'> = { labels: [], datasets: [] };

  // CHART OPTIONS
  // Konfiguration für Achsen, Layout und Tooltip-Verhalten
  public monthlyChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      y: { title: { display: true, text: 'Orders' }, ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.12)' } },
      x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, grid: { display: false } },
    },
  };

  // CHART TYPE
  // Definiert den Diagrammtyp als line
  public monthlyChartType: ChartConfiguration<'line'>['type'] = 'line';

  // CHART REBUILD
  // Baut Labels und Dataset neu aus monthly[] und triggert UI-Update
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

  // ANALYTICS LOAD
  // Lädt Analytics vom Backend für das ausgewählte Jahr und den ausgewählten Monat
  loadAnalytics() {
    this.isLoading = true;
    this.cdr.detectChanges();

    const url = `${this.API}/owner/analytics?year=${this.currentYear}&month=${this.currentMonth}`;

    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: (res) => {
        if (res?.selected?.year && res?.selected?.month) {
          this.currentYear = Number(res.selected.year);
          this.currentMonth = Number(res.selected.month);
        }

        this.orderCounts = res.orderCounts ?? { day: 0, week: 0, month: 0 };

        this.monthly = (res.monthly ?? []).map((x: any) => ({
          day: Number(x.day),
          value: Number(x.value),
        }));

        this.items = (res.items ?? []).map((x: any) => ({
          name: x.name,
          sold: Number(x.sold ?? 0),
          revenue: Number(x.revenue ?? 0),
        }));

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

        if (err.status === 401 || err.status === 403) this.authService.logout();
        alert(err.error?.error || 'Failed to load analytics');
      },
    });
  }

  // REVIEW DETAILS LOAD
  // Öffnet das Review-Modal und lädt die Details für die ausgewählte Review-ID
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

  // REVIEW MODAL CLOSE
  // Schließt das Review-Modal und setzt die Detaildaten zurück
  closeReviewModal() {
    this.isReviewModalOpen = false;
    this.isReviewLoading = false;
    this.selectedReview = null;
    this.cdr.detectChanges();
  }

  // REPORT MODAL OPEN
  // Öffnet das Report-Modal und setzt Eingabefelder zurück
  openReport(r: Review) {
    this.reportTarget = r;
    this.reportText = '';
    this.isReportModalOpen = true;
    this.isReportSending = false;
    this.cdr.detectChanges();
  }

  // REPORT MODAL CLOSE
  // Schließt das Report-Modal und setzt Status und Eingaben zurück
  closeReportModal() {
    this.isReportModalOpen = false;
    this.isReportSending = false;
    this.reportText = '';
    this.reportTarget = null;
    this.cdr.detectChanges();
  }

  // REPORT SUBMIT
  // Sendet einen Report für eine Review an das Backend
  submitReport() {
    const r = this.reportTarget;
    const reason = this.reportText.trim();
    if (!r) return;
    if (!reason) {
      alert('Please write a reason.');
      return;
    }

    this.isReportSending = true;
    this.cdr.detectChanges();

    this.http
      .post<any>(`${this.API}/owner/reviews/${r.id}/report`, { reason }, { headers: this.headers() })
      .subscribe({
        next: () => {
          this.isReportSending = false;
          this.cdr.detectChanges();
          alert('Report sent!');
          this.closeReportModal();
        },
        error: (err) => {
          console.log('REPORT ERROR', err);
          this.isReportSending = false;
          this.cdr.detectChanges();
          alert(err.error?.error || 'Failed to send report');
        },
      });
  }
}
