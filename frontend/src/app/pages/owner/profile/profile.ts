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
// Rückgabeformat vom Backend für das Restaurant-Profil inklusive Bildpfade
type ProfileResponse = {
  id: number;
  name: string;
  email: string;
  phone: string;
  delivery_zone: number;
  opening_hours: Record<DayKey, OpeningDay>;

  logo_path?: string | null;
  cover_path?: string | null;
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
    deliveryZone: 0,
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

  // RESTAURANT IMAGES
  // Speichert Pfade und URL-Varianten sowie lokale Preview-URLs
  logo_path: string | null = null;
  cover_path: string | null = null;

  logoUrl: string | null = null;
  coverUrl: string | null = null;

  logoPreviewUrl: string | null = null;
  coverPreviewUrl: string | null = null;

  // IMAGE UPLOAD STATE
  // Flags für laufende Uploads damit UI gesperrt werden kann
  uploadingLogo = false;
  uploadingCover = false;

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

  // IMAGE URL BUILDER
  // Baut eine volle URL aus einem gespeicherten /uploads/... Pfad
  private toFullUrl(p: string | null | undefined): string | null {
    if (!p) return null;
    return `${this.baseUrl}${p}`;
  }

  // DELIVERY ZONE LABEL
  // Baut das Anzeige-Label "X km radius" aus der gespeicherten Zahl
  get deliveryZoneLabel(): string {
    const n = Number(this.profile.deliveryZone);
    if (!Number.isFinite(n) || n <= 0) return '-';
    return `${n} km radius`;
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
            deliveryZone: Number(data?.delivery_zone ?? 0),
          };

          this.openingHours = data?.opening_hours ?? this.openingHours;

          // IMAGE STATE MAP
          this.logo_path = data?.logo_path ?? null;
          this.cover_path = data?.cover_path ?? null;

          this.logoUrl = this.toFullUrl(this.logo_path);
          this.coverUrl = this.toFullUrl(this.cover_path);

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
      logo_path: this.logo_path,
      cover_path: this.cover_path,
      logoUrl: this.logoUrl,
      coverUrl: this.coverUrl,
    };
    this.isEditing = true;
    this.cdr.detectChanges();
  }

  // EDIT MODE CANCEL
  // Stellt Backup wieder her und verlässt den Edit-Modus ohne zu speichern
  cancelEdit() {
    if (this.backup) {
      this.profile = this.backup.profile;
      this.openingHours = this.backup.openingHours;

      this.logo_path = this.backup.logo_path;
      this.cover_path = this.backup.cover_path;
      this.logoUrl = this.backup.logoUrl;
      this.coverUrl = this.backup.coverUrl;
    }

    // PREVIEW CLEANUP
    if (this.logoPreviewUrl) URL.revokeObjectURL(this.logoPreviewUrl);
    if (this.coverPreviewUrl) URL.revokeObjectURL(this.coverPreviewUrl);
    this.logoPreviewUrl = null;
    this.coverPreviewUrl = null;

    this.isEditing = false;
    this.cdr.detectChanges();
  }

  // PROFILE SAVE
  // Baut Payload aus UI-Modell und speichert via PUT /owner/profile
  saveProfile() {

    const dz = Number(this.profile.deliveryZone);
    const delivery_zone = Number.isFinite(dz) ? dz : 0;

    const payload = {
      name: this.profile.restaurantName,
      email: this.profile.email,
      phone: this.profile.phone,
      delivery_zone,
      opening_hours: this.openingHours,
    };

    this.http.put(`${this.baseUrl}/owner/profile`, payload, this.authHeaders())
      .subscribe({
        next: () => {
          this.isEditing = false;

          // PREVIEW CLEANUP
          if (this.logoPreviewUrl) URL.revokeObjectURL(this.logoPreviewUrl);
          if (this.coverPreviewUrl) URL.revokeObjectURL(this.coverPreviewUrl);
          this.logoPreviewUrl = null;
          this.coverPreviewUrl = null;

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

  // FILE PICKER HELPERS
  // Öffnet versteckte File Inputs für Logo oder Cover
  triggerLogoPicker(input: HTMLInputElement) {
    input.click();
  }

  triggerCoverPicker(input: HTMLInputElement) {
    input.click();
  }

  // LOGO UPLOAD
  // Erstellt lokale Preview und lädt Logo zu POST /owner/profile/logo hoch
  onLogoSelected(event: Event) {
    if (!this.isEditing || this.uploadingLogo) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.logoPreviewUrl) URL.revokeObjectURL(this.logoPreviewUrl);
    this.logoPreviewUrl = URL.createObjectURL(file);
    this.cdr.detectChanges();

    const form = new FormData();
    form.append('image', file);

    this.uploadingLogo = true;
    this.cdr.detectChanges();

    this.http
      .post<any>(`${this.baseUrl}/owner/profile/logo`, form, this.authHeaders())
      .subscribe({
        next: (res) => {
          const p = res?.picture_path ?? null;

          this.logo_path = p;
          this.logoUrl = this.toFullUrl(p);

          if (this.logoPreviewUrl) {
            URL.revokeObjectURL(this.logoPreviewUrl);
            this.logoPreviewUrl = null;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.error || 'Could not upload logo');
          this.cdr.detectChanges();
        },
        complete: () => {
          this.uploadingLogo = false;
          input.value = '';
          this.cdr.detectChanges();
        }
      });
  }

  // COVER UPLOAD
  // Erstellt lokale Preview und lädt Cover zu POST /owner/profile/cover hoch
  onCoverSelected(event: Event) {
    if (!this.isEditing || this.uploadingCover) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.coverPreviewUrl) URL.revokeObjectURL(this.coverPreviewUrl);
    this.coverPreviewUrl = URL.createObjectURL(file);
    this.cdr.detectChanges();

    const form = new FormData();
    form.append('image', file);

    this.uploadingCover = true;
    this.cdr.detectChanges();

    this.http
      .post<any>(`${this.baseUrl}/owner/profile/cover`, form, this.authHeaders())
      .subscribe({
        next: (res) => {
          const p = res?.picture_path ?? null;

          this.cover_path = p;
          this.coverUrl = this.toFullUrl(p);

          if (this.coverPreviewUrl) {
            URL.revokeObjectURL(this.coverPreviewUrl);
            this.coverPreviewUrl = null;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.error || 'Could not upload cover image');
          this.cdr.detectChanges();
        },
        complete: () => {
          this.uploadingCover = false;
          input.value = '';
          this.cdr.detectChanges();
        }
      });
  }
}
