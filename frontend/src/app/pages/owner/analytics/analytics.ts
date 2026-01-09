import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';

type MonthlyPoint = { day: number; value: number };

type PopularItem = {
  name: string;
  sold: number;
  revenue: number;
};

type RecentOrder = {
  id: string;
  date: string;
  total: number;
  status: 'new' | 'preparing' | 'ready' | 'complete';
};

@Component({
  standalone: true,
  selector: 'app-owner-analytics',
  imports: [CommonModule, Navbar],
  templateUrl: './analytics.html',
})
export class OwnerAnalytics {
  // Order counts
  orderCounts = { day: 30, week: 160, month: 1203 };

  // Monthly overview (demo: orders/day)
  monthly: MonthlyPoint[] = [
    { day: 1, value: 42 }, { day: 2, value: 35 }, { day: 3, value: 58 }, { day: 4, value: 31 }, { day: 5, value: 49 },
    { day: 6, value: 61 }, { day: 7, value: 38 }, { day: 8, value: 52 }, { day: 9, value: 44 }, { day: 10, value: 40 },
    { day: 11, value: 55 }, { day: 12, value: 29 }, { day: 13, value: 47 }, { day: 14, value: 53 }, { day: 15, value: 36 },
    { day: 16, value: 41 }, { day: 17, value: 50 }, { day: 18, value: 33 }, { day: 19, value: 46 }, { day: 20, value: 59 },
    { day: 21, value: 34 }, { day: 22, value: 48 }, { day: 23, value: 39 }, { day: 24, value: 45 }, { day: 25, value: 28 },
    { day: 26, value: 37 }, { day: 27, value: 51 }, { day: 28, value: 43 }, { day: 29, value: 32 }, { day: 30, value: 49 },
  ];

  // Popular items raw
  items: PopularItem[] = [
    { name: 'Fries', sold: 92, revenue: 322.0 },
    { name: 'Cola', sold: 77, revenue: 231.0 },
    { name: 'Classic Burger', sold: 58, revenue: 638.0 },
    { name: 'Chicken Strips', sold: 41, revenue: 410.0 },
    { name: 'Cheesecake', sold: 27, revenue: 189.0 },
  ];

  // Recent orders demo
  recentOrders: RecentOrder[] = [
    { id: 'ORDER-1238', date: '2026-12-13', total: 15.4, status: 'new' },
    { id: 'ORDER-1237', date: '2026-12-13', total: 9.9, status: 'new' },
    { id: 'ORDER-1236', date: '2026-12-13', total: 18.2, status: 'ready' },
    { id: 'ORDER-1235', date: '2026-12-13', total: 13.0, status: 'preparing' },
    { id: 'ORDER-1234', date: '2026-12-13', total: 21.5, status: 'complete' },
  ];

  get popularItems(): PopularItem[] {
    return [...this.items].sort((a, b) => b.sold - a.sold);
  }

  // ---------- Chart helpers ----------
  private chartW = 560;
  private chartH = 200;
  private pad = 18;
  private bottomSpace = 26;

  get monthlyMin(): number {
    return Math.min(...this.monthly.map(p => p.value));
  }
  get monthlyMax(): number {
    return Math.max(...this.monthly.map(p => p.value));
  }
  get monthlyMid(): number {
    return Math.round((this.monthlyMin + this.monthlyMax) / 2);
  }
  get monthlyAvg(): number {
  const sum = this.monthly.reduce((acc, d) => acc + d.value, 0);
  return Math.round(sum / this.monthly.length);
  }

  private yFromValue(v: number): number {
    const min = this.monthlyMin;
    const max = this.monthlyMax;
    const range = Math.max(1, max - min);

    const innerH = this.chartH - this.pad * 2 - this.bottomSpace;
    return this.pad + innerH * (1 - (v - min) / range);
  }

  private xFromIndex(i: number): number {
    const innerW = this.chartW - this.pad * 2;
    const stepX = innerW / Math.max(1, this.monthly.length - 1);
    return this.pad + i * stepX;
  }

  get monthlyPolylinePoints(): string {
    if (!this.monthly.length) return '';
    return this.monthly
      .map((p, i) => `${this.xFromIndex(i).toFixed(1)},${this.yFromValue(p.value).toFixed(1)}`)
      .join(' ');
  }

  get monthlyDots(): { cx: number; cy: number; value: number }[] {
    return this.monthly.map((p, i) => ({
      cx: Number(this.xFromIndex(i).toFixed(1)),
      cy: Number(this.yFromValue(p.value).toFixed(1)),
      value: p.value,
    }));
  }

  get monthlyBottomLabelY(): number {
    return this.chartH - 8;
  }

  statusLabel(s: RecentOrder['status']): string {
    return s.toUpperCase();
  }
}
