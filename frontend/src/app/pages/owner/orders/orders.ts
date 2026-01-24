import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Navbar } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth.service';
import { MapService } from '../../../services/map.service';

type OrderItem = {
  name: string;
  quantity: number;
};

type OrderStatus = 'new' | 'preparing' | 'ready' | 'complete';

type GeoJsonPoint = { type: 'Point'; coordinates: [number, number] };

type Order = {
  _id: number;          // DB id für API calls
  id: string;           // Anzeige: ORDER-0001
  customerName: string;
  address: string;      // wird hier mit Straße befüllt
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
export class OwnerOrders implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);

  private API = 'http://localhost:3000';

  activeFilter: 'all' | OrderStatus = 'all';
  searchTerm = '';

  // Orders aus Backend
  orders: Order[] = [];
  isLoading = false;

  // Cache: orderId -> Adresse (Straße only)
  private addressCache = new Map<number, string>();

  ngOnInit() {
    this.loadOrders();
  }

  // Authorization Header (ohne Bearer)
  private headers() {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }

  // Nimmt nur "Straße Hausnummer" (Teil vor dem ersten Komma)
  private formatStreetOnly(fullAddress: string): string {
    if (!fullAddress) return '';
    const firstPart = fullAddress.split(',')[0]?.trim();
    return firstPart || fullAddress.trim();
  }

  // Orders vom Backend laden
  loadOrders() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.get<any>(`${this.API}/owner/orders`, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.orders = (res.orders ?? []).map((o: Order) => ({
          ...o,
          address: o.address ?? '',
        }));

        // Adresse für alle Orders auflösen
        this.resolveAddressesForOrders(this.orders);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('LOAD /owner/orders ERROR', err);
        this.isLoading = false;
        this.cdr.detectChanges();

        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
        }
        alert(err.error?.error || 'Failed to load orders');
      },
    });
  }

  // Alle Order-Adressen auf Straße umwandeln (mit Cache)
  private resolveAddressesForOrders(orders: Order[]) {
    for (const order of orders) {
      // Cache
      const cached = this.addressCache.get(order._id);
      if (cached) {
        order.address = cached;
        continue;
      }

      // Location prüfen
      const loc = order.location;
      if (!loc?.coordinates || loc.coordinates.length !== 2) {
        order.address = order.address || '-';
        continue;
      }

      const [lng, lat] = loc.coordinates;

      // Reverse-Geocoding holen und kürzen
      this.mapService.getAddressFromPosition(lat, lng).subscribe({
        next: (address) => {
          const streetOnly = this.formatStreetOnly(address || '');
          const finalAddr = streetOnly || `${lat}, ${lng}`;

          this.addressCache.set(order._id, finalAddr);
          order.address = finalAddr;
          this.cdr.detectChanges();
        },
        error: () => {
          const fallback = `${lat}, ${lng}`;
          this.addressCache.set(order._id, fallback);
          order.address = fallback;
          this.cdr.detectChanges();
        },
      });
    }

    this.cdr.detectChanges();
  }

  // Filter setzen
  setFilter(filter: 'all' | OrderStatus) {
    this.activeFilter = filter;
    this.cdr.detectChanges();
  }

  // Gefilterte + gesuchte Orders
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

  // Status-Update helper
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

  // NEW -> PREPARING
  startPreparing(order: Order) {
    this.updateStatus(order, 'preparing');
  }

  // PREPARING -> READY
  markReady(order: Order) {
    this.updateStatus(order, 'ready');
  }

  // READY -> COMPLETE
  completeOrder(order: Order) {
    this.updateStatus(order, 'complete');
  }

  // NEW -> Reject (löschen)
  rejectOrder(order: Order) {
    const id = order._id;

    const old = this.orders;
    this.orders = this.orders.filter((o) => o._id !== id);
    this.addressCache.delete(id);
    this.cdr.detectChanges();

    this.http.delete<any>(`${this.API}/owner/orders/${id}`, { headers: this.headers() }).subscribe({
      next: () => {
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('REJECT ERROR', err);
        this.orders = old;
        this.cdr.detectChanges();
        alert(err.error?.error || 'Reject failed');
      },
    });
  }

  // Label für Badge
  statusLabel(status: OrderStatus): string {
    return status.toUpperCase();
  }
}

