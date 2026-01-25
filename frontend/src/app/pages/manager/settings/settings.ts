import { Component,OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

type Settings = {
  id: number;
  delivery_distance: number;
  discount: number;
  service_fee: number;
}

type DiscountCode = {
  code: string;
  percent: number;
  amount: number;
}

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [CommonModule, Navbar],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class ManagerSettings  implements OnInit{
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  settings: Settings[] = [];
  codes: DiscountCode[] = [];

  isLoading = false;
  errorMsg: string | null = null;
  private API = 'http://localhost:3000';

  ngOnInit() {
    this.loadSettings();
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

  loadSettings() {
    this.isLoading = true;
    this.errorMsg = null;

    this.http.get<Settings[]>(
      `http://localhost:3000/manager/settings`,
      this.getAuthHeaders()
    )
    .subscribe({
      next: (rows) => {
        console.log('loaded settings', rows);
        this.settings = rows ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (this.handleAuthError(err))return;
        console.error(err);
        this.errorMsg = 'Error laoding settings';
        this.cdr.detectChanges();
      }
    });
  }

  updateSettings(settings: Settings) {
    this.http.patch<Settings>(
      `${this.API}/manager/settings`,
      this.getAuthHeaders()
    )
    .subscribe({
      next: () => {
        
      },
      error: (err) => {
        if (this.handleAuthError(err)) return;
        console.error(err);
        this.errorMsg = 'Failed to update settings';
        this.cdr.detectChanges();
      }
    })

  }

  handleAuthError(err: any) {
    if(err?.status === 401 || err?.status === 403) {
      this.router.navigate(['/authentication']);
      return true;
    }
    return false;
  }
}
