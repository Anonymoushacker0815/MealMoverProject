import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type OpeningDay = {
  label: string;
  closed: boolean;
  open: string;
  close: string;
};

type ProfileResponse = {
  id: number;
  name: string;
  email: string;
  phone: string;
  delivery_zone: string;
  opening_hours: Record<DayKey, OpeningDay>;
};

@Component({
  standalone: true,
  selector: 'app-owner-profile',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './profile.html',
})
export class OwnerProfile implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  private baseUrl = 'http://localhost:3000';

  // UI state
  isEditing = false;
  isLoading = true;
  loadError: string | null = null;

  days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  trackByDay = (_: number, day: DayKey) => day;

  // Default values
  profile = {
    restaurantName: 'Loading...',
    email: 'Loading...',
    phone: 'Loading...',
    deliveryZone: 'Loading...',
  };

  openingHours: Record<DayKey, OpeningDay> = {
    mon: { label: 'Mon', closed: false, open: '09:00', close: '18:00' },
    tue: { label: 'Tue', closed: false, open: '09:00', close: '18:00' },
    wed: { label: 'Wed', closed: false, open: '09:00', close: '18:00' },
    thu: { label: 'Thu', closed: false, open: '09:00', close: '18:00' },
    fri: { label: 'Fri', closed: false, open: '09:00', close: '20:00' },
    sat: { label: 'Sat', closed: false, open: '10:00', close: '20:00' },
    sun: { label: 'Sun', closed: true, open: '00:00', close: '00:00' },
  };

  private backup: any = null;

  ngOnInit(): void {
    this.loadProfile();
  }

  private authHeaders() {
    const token =
      (this.auth as any).getToken?.() ||
      localStorage.getItem('token');

    return { headers: { Authorization: `Bearer ${token}` } };
  }

  // Load from backend
  loadProfile() {
    this.isLoading = true;
    this.loadError = null;

    this.http.get<ProfileResponse>(`${this.baseUrl}/owner/profile`, this.authHeaders())
      .subscribe({
        next: (data) => {
          this.profile = {
            restaurantName: data?.name ?? '',
            email: data?.email ?? '',
            phone: data?.phone ?? '',
            deliveryZone: data?.delivery_zone ?? '',
          };

          this.openingHours = data?.opening_hours ?? this.openingHours;

          this.isLoading = false;

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.loadError = `Could not load profile (${err.status}): ${err.error?.error || err.message}`;
          this.cdr.detectChanges();
        }
      });
  }

  startEdit() {
    this.backup = {
      profile: JSON.parse(JSON.stringify(this.profile)),
      openingHours: JSON.parse(JSON.stringify(this.openingHours)),
    };
    this.isEditing = true;
  }

  cancelEdit() {
    if (this.backup) {
      this.profile = this.backup.profile;
      this.openingHours = this.backup.openingHours;
    }
    this.isEditing = false;
  }

  saveProfile() {
    const payload = {
      name: this.profile.restaurantName,
      email: this.profile.email,
      phone: this.profile.phone,
      delivery_zone: this.profile.deliveryZone,
      opening_hours: this.openingHours,
    };

    this.http.put(`${this.baseUrl}/owner/profile`, payload, this.authHeaders())
      .subscribe({
        next: () => {
          this.isEditing = false;
          this.loadProfile();
        },
        error: (err) => {
          console.error(err);
          alert(`Could not save profile (${err.status}): ${err.error?.error || err.message}`);
        }
      });
  }

  setAllWeekdays(open: string, close: string) {
    (['mon', 'tue', 'wed', 'thu', 'fri'] as DayKey[]).forEach(d => {
      this.openingHours[d].closed = false;
      this.openingHours[d].open = open;
      this.openingHours[d].close = close;
    });
  }
}
