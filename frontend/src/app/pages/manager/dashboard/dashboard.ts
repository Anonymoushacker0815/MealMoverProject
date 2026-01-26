
import { Component,OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

type Income = {
  amount: number;
}

type UserCount = {
  name: string;
  amount: number;
}

type OrderStats = {
  id: number;
  amount: number;
  income: number;
}

type Restaurant = {
  id: number;
  name: string;
  email: string;
  phone: string;
  opening_hours: string;
  status: string;
}

type UserStatus = 'Active' | 'Suspended' | 'Pending';
type UserType = 'Customer' | 'Restaurant' | 'Admin';

interface ModerationUser {
  id: number;
  email: string;
  username: string | null;
  user_type: UserType;
  status: UserStatus;
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class ManagerDashboard implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private api = 'http://localhost:3000';

  pendingRestaurants: ModerationUser[] = [];
  pendingCount = 0;

  incomes: Income[] = [];
  userCounts: UserCount[] = [];
  orderStats: OrderStats[] = [];
  restaurants: Restaurant[] = [];

  isLoadingPending = false;
  pendingError: string | null = null;

  isLoadingIncome = false;
  incomeError: string | null = null;

  isLoadingUserCount = false;
  userCountError: string | null = null;

  isLoadingOrderStats = false;
  orderStatsError: string | null = null;

  isLoadingAllRestaurants = false;
  allRestaurantsError: string | null = null;

  ngOnInit() {
    this.loadPendingRestaurants();
    this.loadGlobalIncome();
    this.loadingUserCount();
    this.loadOrderStats();
    this.loadAllRestaurants();
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

  loadPendingRestaurants() {
    this.isLoadingPending = true;
    this.pendingError = null;

    this.http
      .get<ModerationUser[]>(
        'http://localhost:3000/moderation/users',
        this.getAuthHeaders()
      )
      .subscribe({
        next: (rows) => {
          const list = rows ?? [];
          const pending = list.filter(
            (u) => u.user_type === 'Restaurant' && u.status === 'Pending'
          );

          this.pendingRestaurants = pending;
          this.pendingCount = pending.length;

          this.isLoadingPending = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoadingPending = false;
          if (this.handleAuthError(err)) return;
          console.error(err);
          this.pendingError = 'Failed to load pending restaurants';
          this.cdr.detectChanges();
        },
      });
  }

  loadGlobalIncome() {
    this.isLoadingIncome = true;
    this.incomeError = null;

    this.http.get<Income[]>(
      `${this.api}/manager/dashboard/income`,
      this.getAuthHeaders()
    )
    .subscribe({
      next: (rows) => {
        this.incomes = rows ?? [];
        this.isLoadingIncome = false;
        console.log(this.incomes[0].amount);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingIncome = false;
        if (this.handleAuthError(err)) return;
        console.error(err);
        this.incomeError = 'Error loading Income';
        this.cdr.detectChanges();
      }
    });
  }

  loadingUserCount() {
    this.isLoadingUserCount = true;
    this.userCountError = null;

    this.http.get<UserCount[]>(
      `${this.api}/manager/dashboard/usercount`,
      this.getAuthHeaders()
    )
    .subscribe({
      next: (rows) => {
        this.userCounts = rows ?? [];
        this.isLoadingUserCount = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingUserCount = false;
        if (this.handleAuthError(err)) return;
        console.error(err);
        this.userCountError = 'Error loading User Counts';
        this.cdr.detectChanges();
      }
    });
  }

  loadOrderStats() {
    this.isLoadingOrderStats = true;
    this.orderStatsError = null;

    this.http.get<OrderStats[]>(
      `${this.api}/manager/dashboard/orders`,
      this.getAuthHeaders()
    )
    .subscribe({
      next: (rows) => {
        this.orderStats = rows ?? [];
        this.isLoadingOrderStats = false;
        console.log(this.orderStats);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingOrderStats = false;
        if (this.handleAuthError(err)) return;
        console.error(err);
        this.orderStatsError = 'Error loading Order Stats';
        this.cdr.detectChanges();
      }
    });
  }

  loadAllRestaurants() {
    this.isLoadingAllRestaurants = true;
    this.allRestaurantsError = null;

    this.http.get<Restaurant[]>(
      `${this.api}/manager/dashboard/usercount`,
      this.getAuthHeaders()
    )
    .subscribe({
      next: (rows) => {
        this.restaurants = rows ?? [];
        this.isLoadingAllRestaurants = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingAllRestaurants = false;
        if (this.handleAuthError(err)) return;
        console.error(err);
        this.allRestaurantsError = 'Error loading All Restaurants';
        this.cdr.detectChanges();
      }
    })
  }

  goToUsers() {
    this.router.navigate(['/manager/users']);
  }

  private handleAuthError(err: any) {
    if (err?.status === 401 || err?.status === 403) {
      this.router.navigate(['/authentication']);
      return true;
    }
    return false;
  }
}