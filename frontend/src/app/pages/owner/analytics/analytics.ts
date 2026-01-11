import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';

import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartOptions,
  registerables,
} from 'chart.js';

Chart.register(...registerables);

type MonthlyPoint = { day: number; value: number };

type PopularItem = {
  name: string;
  sold: number;
  revenue: number;
};

type Review = {
  orderId: string;
  date: string;
  rating: number;
};

@Component({
  standalone: true,
  selector: 'app-owner-analytics',
  imports: [CommonModule, Navbar, BaseChartDirective],
  templateUrl: './analytics.html',
})
export class OwnerAnalytics {
  // Order counts
  orderCounts = { day: 30, week: 160, month: 1203 };

  // Monthly overview
  monthly: MonthlyPoint[] = [
    { day: 1, value: 42 }, { day: 2, value: 35 }, { day: 3, value: 58 }, { day: 4, value: 31 }, { day: 5, value: 49 },
    { day: 6, value: 61 }, { day: 7, value: 38 }, { day: 8, value: 52 }, { day: 9, value: 44 }, { day: 10, value: 40 },
    { day: 11, value: 55 }, { day: 12, value: 29 }, { day: 13, value: 47 }, { day: 14, value: 53 }, { day: 15, value: 36 },
    { day: 16, value: 41 }, { day: 17, value: 50 }, { day: 18, value: 33 }, { day: 19, value: 46 }, { day: 20, value: 59 },
    { day: 21, value: 34 }, { day: 22, value: 48 }, { day: 23, value: 39 }, { day: 24, value: 45 }, { day: 25, value: 28 },
    { day: 26, value: 37 }, { day: 27, value: 51 }, { day: 28, value: 43 }, { day: 29, value: 32 }, { day: 30, value: 49 },
  ];

  // Popular items
  items: PopularItem[] = [
    { name: 'Fries', sold: 92, revenue: 322.0 },
    { name: 'Cola', sold: 77, revenue: 231.0 },
    { name: 'Classic Burger', sold: 58, revenue: 638.0 },
    { name: 'Chicken Strips', sold: 41, revenue: 410.0 },
    { name: 'Cheesecake', sold: 27, revenue: 189.0 },
  ];

  // Reviews
  reviews: Review[] = [
    { orderId: 'Order-1234', date: '2026-12-13', rating: 4 },
    { orderId: 'Order-1235', date: '2026-12-13', rating: 4 },
    { orderId: 'Order-1236', date: '2026-12-13', rating: 5 },
    { orderId: 'Order-1237', date: '2026-12-13', rating: 3 },
    { orderId: 'Order-1238', date: '2026-12-13', rating: 4 },
  ];

  get popularItems(): PopularItem[] {
    return [...this.items].sort((a, b) => b.sold - a.sold);
  }

  // Chart.js config
  public monthlyChartData: ChartData<'line'> = {
    labels: this.monthly.map(m => `Day ${m.day}`),
    datasets: [
      {
        label: 'Orders',
        data: this.monthly.map(m => m.value),
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
          maxTicksLimit: 8,
        },
        grid: { display: false },
      },
    },
  };

  public monthlyChartType: ChartConfiguration<'line'>['type'] = 'line';

  // Review View and Report
  viewReview(r: Review) {
    alert(`View review for ${r.orderId} (rating: ${r.rating})`);
  }

  reportReview(r: Review) {
    alert(`Report review for ${r.orderId}`);
  }
}
