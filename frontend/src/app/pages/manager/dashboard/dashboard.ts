import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

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

  pendingRestaurants: ModerationUser[] = [];
  pendingCount = 0;

  isLoadingPending = false;
  pendingError: string | null = null;

  ngOnInit() {
    this.loadPendingRestaurants();
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