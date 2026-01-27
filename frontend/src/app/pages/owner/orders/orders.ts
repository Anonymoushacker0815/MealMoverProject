// ANGULAR CORE & LIFECYCLE
// Basisfunktionen für Komponenten, Lifecycle Hooks, Cleanup und Change Detection
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

// ANGULAR COMMON MODULES
// Grundlegende Direktiven und Template-Formulare
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// HTTP
// HTTP Client und Header für API-Requests
import { HttpClient, HttpHeaders } from '@angular/common/http';

// UI COMPONENTS & SERVICES
// Navbar-Komponente sowie Auth-Service und MapService für Adressauflösung
import { Navbar } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth.service';
import { MapService } from '../../../services/map.service';


// ORDER ITEM MODEL
// Ein einzelnes Item innerhalb einer Bestellung
type OrderItem = {
  name: string;
  quantity: number;
};

// ORDER STATUS MODEL
// UI-Status für Bestellungen inklusive rejected
type OrderStatus = 'new' | 'preparing' | 'ready' | 'complete' | 'rejected';

// LOCATION MODEL
// GeoJSON Point Typ für Kunden-Location
type GeoJsonPoint = { type: 'Point'; coordinates: [number, number] };

// ORDER MODEL
// Datenmodell einer Bestellung inkl. Items, Status und optionaler Location
type Order = {
  _id: number;
  id: string;
  customerName: string;
  address: string;
  status: OrderStatus;
  items: OrderItem[];
  location?: GeoJsonPoint | any;
};


// COMPONENT DEFINITION
// Standalone Owner-Orders Seite zum Anzeigen, Filtern und Updaten von Bestellungen
@Component({
  standalone: true,
  selector: 'app-owner-orders',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './orders.html',
})
export class OwnerOrders implements OnInit, OnDestroy {

  // SERVICE INJECTIONS
  // HTTP für API-Aufrufe, Auth für Logout bei 401/403, MapService für Reverse-Geocoding, ChangeDetector für UI-Updates
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);

  // BACKEND CONFIG
  // Basis-URL für Owner Orders Endpunkte
  private API = 'http://localhost:3000';

  // FILTER STATE
  // Aktiver Status-Filter und Suchbegriff für Orders
  activeFilter: 'all' | OrderStatus = 'all';
  searchTerm = '';

  // ORDERS DATA
  // Geladene Orders sowie Ladezustand
  orders: Order[] = [];
  isLoading = false;

  // ADDRESS CACHE
  // Zwischenspeicher für aufgelöste Adressen pro Order-ID
  private addressCache = new Map<number, string>();

  // AUTO REFRESH
  // Timer für periodisches Nachladen der Orders
  private refreshTimer: any = null;
  private readonly REFRESH_MS = 5000;

  // LIFECYCLE HOOK
  // Lädt initial die Orders und startet Auto-Refresh
  ngOnInit() {
    this.loadOrders(true);
    this.startAutoRefresh();
  }

  // LIFECYCLE CLEANUP
  // Stoppt den Auto-Refresh beim Verlassen der Komponente
  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  // AUTH HEADER HELPER
  // Erstellt Authorization Header mit JWT (ohne Bearer, passend zu deinem Backend)
  private headers() {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }

  // ADDRESS FORMATTER
  // Kürzt eine volle Adresse auf den Straßenanteil vor dem ersten Komma
  private formatStreetOnly(fullAddress: string): string {
    if (!fullAddress) return '';
    const firstPart = fullAddress.split(',')[0]?.trim();
    return firstPart || fullAddress.trim();
  }

  // AUTO REFRESH START
  // Startet Intervall-Refresh und verhindert doppelte Timer
  private startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(() => this.loadOrders(false), this.REFRESH_MS);
  }

  // AUTO REFRESH STOP
  // Stoppt den Intervall-Refresh sicher
  private stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ORDERS LOAD
  // Lädt Orders vom Backend und startet danach die Adressauflösung
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

  // ADDRESS RESOLVE
  // Wandelt Koordinaten per MapService in eine lesbare Adresse um und cached das Ergebnis
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

  // FILTER SET
  // Setzt den aktiven Status-Filter für die Anzeige
  setFilter(filter: 'all' | OrderStatus) {
    this.activeFilter = filter;
    this.cdr.detectChanges();
  }

  // FILTERED ORDERS
  // Filtert Orders nach Status und Suchbegriff (ID, Kunde, Adresse)
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

  // STATUS UPDATE HELPER
  // Aktualisiert Status optimistisch in der UI und speichert ihn danach im Backend
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

  // STATUS ACTIONS
  // Convenience-Methoden für die Buttons im UI
  startPreparing(order: Order) {
    this.updateStatus(order, 'preparing');
  }

  markReady(order: Order) {
    this.updateStatus(order, 'ready');
  }

  completeOrder(order: Order) {
    this.updateStatus(order, 'complete');
  }

  // REJECT ORDER
  // Setzt Order auf rejected (UI sofort) und nutzt Backend-DELETE, das intern ein Status-Update macht
  rejectOrder(order: Order) {
    const oldStatus = order.status;

    order.status = 'rejected';
    this.cdr.detectChanges();

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

  // STATUS LABEL
  // Wandelt Status in eine Anzeige-Form (aktuell einfach Uppercase)
  statusLabel(status: OrderStatus): string {
    return status.toUpperCase();
  }
}
