// ANGULAR CORE & LIFECYCLE
// Basisfunktionen für Komponenten, Lifecycle und Dependency Injection
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

// ANGULAR COMMON MODULES
// Grundlegende Direktiven und Template-Formulare
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// UI COMPONENTS & SERVICES
// Navbar-Komponente sowie HTTP-Client und Auth-Service
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';


// OPENING HOURS TYPES
// Typen für Wochentage und die Opening-Hours Struktur
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type OpeningDay = {
  label: string;
  closed: boolean;
  open: string;
  close: string;
};

// BACKEND RESPONSE MODEL
// Rückgabeformat vom Backend für das Restaurant-Profil
type ProfileResponse = {
  id: number;
  name: string;
  email: string;
  phone: string;
  delivery_zone: string;
  opening_hours: Record<DayKey, OpeningDay>;
};


// COMPONENT DEFINITION
// Standalone Owner-Profilseite zum Anzeigen und Bearbeiten der Restaurantdaten
@Component({
  standalone: true,
  selector: 'app-owner-profile',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './profile.html',
})
export class OwnerProfile implements OnInit {

  // SERVICE INJECTIONS
  // HTTP für API-Aufrufe, Auth für Token, ChangeDetector für manuelle UI-Updates
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // BACKEND CONFIG
  // Basis-URL für Owner-Profil Endpunkte
  private baseUrl = 'http://localhost:3000';

  // UI STATE
  // Steuert Edit-Modus, Ladeanzeige und Error-Text
  isEditing = false;
  isLoading = true;
  loadError: string | null = null;

  // DAYS LIST
  // Reihenfolge der Wochentage + trackBy für performantes Rendering
  days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  trackByDay = (_: number, day: DayKey) => day;

  // PROFILE VIEW MODEL
  // UI-freundliches Modell (Restaurant Name, Email, Phone, Delivery Zone)
  profile = {
    restaurantName: 'Loading...',
    email: 'Loading...',
    phone: 'Loading...',
    deliveryZone: 'Loading...',
  };

  // OPENING HOURS MODEL
  // Default Opening Hours als Fallback, falls Backend keine liefert
  openingHours: Record<DayKey, OpeningDay> = {
    mon: { label: 'Mon', closed: false, open: '09:00', close: '18:00' },
    tue: { label: 'Tue', closed: false, open: '09:00', close: '18:00' },
    wed: { label: 'Wed', closed: false, open: '09:00', close: '18:00' },
    thu: { label: 'Thu', closed: false, open: '09:00', close: '18:00' },
    fri: { label: 'Fri', closed: false, open: '09:00', close: '20:00' },
    sat: { label: 'Sat', closed: false, open: '10:00', close: '20:00' },
    sun: { label: 'Sun', closed: true, open: '00:00', close: '00:00' },
  };

  // BACKUP STATE
  // Snapshot zum Zurücksetzen, wenn Edit abgebrochen wird
  private backup: any = null;

  // LIFECYCLE HOOK
  // Lädt Profil beim Start der Komponente
  ngOnInit(): void {
    this.loadProfile();
  }

  // AUTH HEADER HELPER
  // Erstellt Authorization Header mit JWT (Bearer Token)
  private authHeaders() {
    const token =
      (this.auth as any).getToken?.() ||
      localStorage.getItem('token');

    return { headers: { Authorization: `Bearer ${token}` } };
  }

  // PROFILE LOAD
  // Lädt Profil + Opening Hours aus dem Backend und mappt es ins UI-Modell
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

  // EDIT MODE START
  // Sichert aktuellen State als Backup und aktiviert den Edit-Modus
  startEdit() {
    this.backup = {
      profile: JSON.parse(JSON.stringify(this.profile)),
      openingHours: JSON.parse(JSON.stringify(this.openingHours)),
    };
    this.isEditing = true;
  }

  // EDIT MODE CANCEL
  // Stellt Backup wieder her und verlässt den Edit-Modus ohne zu speichern
  cancelEdit() {
    if (this.backup) {
      this.profile = this.backup.profile;
      this.openingHours = this.backup.openingHours;
    }
    this.isEditing = false;
  }

  // PROFILE SAVE
  // Baut Payload aus UI-Modell und speichert via PUT /owner/profile
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

  // QUICK SET WEEKDAYS
  // Setzt Mo–Fr auf fixe Zeiten und markiert diese Tage als geöffnet
  setAllWeekdays(open: string, close: string) {
    (['mon', 'tue', 'wed', 'thu', 'fri'] as DayKey[]).forEach(d => {
      this.openingHours[d].closed = false;
      this.openingHours[d].open = open;
      this.openingHours[d].close = close;
    });
  }
}
