import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Navbar } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth.service';
import { MapService } from '../../../services/map.service';

// Einzelnes Order-Item
type OrderItem = {
  name: string;
  quantity: number;
};

// UI Status (jetzt inkl. rejected)
type OrderStatus = 'new' | 'preparing' | 'ready' | 'complete' | 'rejected';

type GeoJsonPoint = { type: 'Point'; coordinates: [number, number] };

type Order = {
  _id: number;
  id: string;
  customerName: string;
  address: string;
  status: OrderStatus;
  items: OrderItem[];
  location?: GeoJsonPoint | any;
};

@Component({
  standalone: true,
  selector: 'app-owner-orders',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './orders.html',
})
export class OwnerOrders implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);

  private API = 'http://localhost:3000';

  activeFilter: 'all' | OrderStatus = 'all';
  searchTerm = '';

  orders: Order[] = [];
  isLoading = false;

  private addressCache = new Map<number, string>();

  private refreshTimer: any = null;
  private readonly REFRESH_MS = 5000;

  ngOnInit() {
    this.loadOrders(true);
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  private headers() {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }

  private formatStreetOnly(fullAddress: string): string {
    if (!fullAddress) return '';
    const firstPart = fullAddress.split(',')[0]?.trim();
    return firstPart || fullAddress.trim();
  }

  private startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(() => this.loadOrders(false), this.REFRESH_MS);
  }

  private stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  loadOrders(showLoading: boolean) {
    if (showLoading) {
      this.isLoading = true;
      this.cdr.detectChanges();
    }

    this.http.get<any>(`${this.API}/owner/orders`, { headers: this.headers() }).subscribe({
      next: (res) => {
        const incoming: Order[] = (res.orders ?? []).map((o: Order) => ({
          ...o,
          address: o.address ?? '',
        }));

        this.resolveAddressesForOrders(incoming);
        this.orders = incoming;

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('LOAD /owner/orders ERROR', err);
        this.isLoading = false;
        this.cdr.detectChanges();

        if (err.status === 401 || err.status === 403) this.authService.logout();
        if (showLoading) alert(err.error?.error || 'Failed to load orders');
      },
    });
  }

  private resolveAddressesForOrders(orders: Order[]) {
    for (const order of orders) {
      const cached = this.addressCache.get(order._id);
      if (cached) {
        order.address = cached;
        continue;
      }

      const loc = order.location;
      if (!loc?.coordinates || loc.coordinates.length !== 2) {
        order.address = order.address || '-';
        continue;
      }

      const [lng, lat] = loc.coordinates;

      this.mapService.getAddressFromPosition(lat, lng).subscribe({
        next: (address) => {
          const streetOnly = this.formatStreetOnly(address || '');
          const finalAddr = streetOnly || `${lat}, ${lng}`;

          this.addressCache.set(order._id, finalAddr);

          const found = this.orders.find((o) => o._id === order._id);
          if (found) found.address = finalAddr;

          this.cdr.detectChanges();
        },
        error: () => {
          const fallback = `${lat}, ${lng}`;
          this.addressCache.set(order._id, fallback);

          const found = this.orders.find((o) => o._id === order._id);
          if (found) found.address = fallback;

          this.cdr.detectChanges();
        },
      });
    }

    this.cdr.detectChanges();
  }

  setFilter(filter: 'all' | OrderStatus) {
    this.activeFilter = filter;
    this.cdr.detectChanges();
  }

  filteredOrders(): Order[] {
    return this.orders.filter((order) => {
      const matchesFilter = this.activeFilter === 'all' || order.status === this.activeFilter;

      const q = this.searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        (order.address ?? '').toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }

  private updateStatus(order: Order, newStatus: OrderStatus) {
    const oldStatus = order.status;
    order.status = newStatus;
    this.cdr.detectChanges();

    this.http
      .patch<any>(
        `${this.API}/owner/orders/${order._id}/status`,
        { status: newStatus },
        { headers: this.headers() }
      )
      .subscribe({
        next: () => {
          this.loadOrders(false);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.log('STATUS UPDATE ERROR', err);
          order.status = oldStatus;
          this.cdr.detectChanges();
          alert(err.error?.error || 'Status update failed');
        },
      });
  }

  startPreparing(order: Order) {
    this.updateStatus(order, 'preparing');
  }

  markReady(order: Order) {
    this.updateStatus(order, 'ready');
  }

  completeOrder(order: Order) {
    this.updateStatus(order, 'complete');
  }

  // Reject: setzt Status auf rejected (statt löschen)
  rejectOrder(order: Order) {
    const oldStatus = order.status;

    // sofort rejected anzeigen
    order.status = 'rejected';
    this.cdr.detectChanges();

    // Backend: wird als DELETE gelassen macht aber update
    this.http.delete<any>(`${this.API}/owner/orders/${order._id}`, { headers: this.headers() }).subscribe({
      next: () => {
        this.loadOrders(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('REJECT ERROR', err);
        order.status = oldStatus;
        this.cdr.detectChanges();
        alert(err.error?.error || 'Reject failed');
      },
    });
  }

  statusLabel(status: OrderStatus): string {
    return status.toUpperCase();
  }
}
