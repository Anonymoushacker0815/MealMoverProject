import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Navbar } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth.service';

type UserStatus = 'Active' | 'Suspended';

type UserType = 'Customer' | 'Restaurant' | 'Admin';

interface ModerationUser {
  id: number;
  email: string;
  username: string | null;
  user_type: UserType;
  status: UserStatus;
}

@Component({
  selector: 'app-manager-users',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class ManagerUsers implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  users: ModerationUser[] = [];
  isLoading = false;
  errorMsg: string | null = null;

  readonly statuses: UserStatus[] = ['Active', 'Suspended'];

  ngOnInit() {
    this.loadUsers();
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

  loadUsers() {
    this.isLoading = true;
    this.errorMsg = null;

    this.http
      .get<ModerationUser[]>(
        'http://localhost:3000/moderation/users',
        this.getAuthHeaders()
      )
      .subscribe({
        next: (rows) => {
          this.users = rows ?? [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          if (this.handleAuthError(err)) return;
          console.error(err);
          this.errorMsg = 'Failed to load users';
          this.cdr.detectChanges();
        },
      });
  }

  changeStatus(user: ModerationUser, newStatus: UserStatus) {
    if (user.user_type === 'Admin') return;
    if (user.status === newStatus) return;

    this.http
      .patch<{ ok: boolean; userId: number; status: UserStatus }>(
        `http://localhost:3000/moderation/users/${user.id}/status`,
        { status: newStatus },
        this.getAuthHeaders()
      )
      .subscribe({
        next: () => {
          user.status = newStatus;
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (this.handleAuthError(err)) return;
          console.error(err);
          this.errorMsg = 'Failed to update user status';
          this.cdr.detectChanges();
        },
      });
  }

  private handleAuthError(err: any) {
    if (err?.status === 401 || err?.status === 403) {
      this.router.navigate(['/authentication']);
      return true;
    }
    return false;
  }
}
