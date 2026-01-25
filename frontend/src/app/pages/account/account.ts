// Angular Core + Change Detection
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';

// Angular Basics
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Routing & HTTP
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// App Services & Components
import { AuthService } from '../../services/auth.service';
import { UserMap } from '../../components/user-map/user-map';
import { MapService } from '../../services/map.service';

import { Navbar } from '../../components/navbar/navbar';

// GeoJSON Typ für Location
type GeoJsonPoint = { type: 'Point'; coordinates: [number, number] };

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, UserMap, Navbar],
  templateUrl: './account.html',
})
export class Account implements OnInit {

  // Services
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);

  // Backend URL
  private API = 'http://localhost:3000';

  // Aktueller User
  user: any = null;

  // Anzeigename der Adresse
  addressLabel = '';
  isAddressLoading = false;

  // UI Status
  isEditing = false;
  isChangingPassword = false;

  // Editierbare Profildaten
  edit = {
    email: '',
    username: '',
    location: null as GeoJsonPoint | null,
  };

  // Passwort-Änderung
  pw = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };

  // Initialisierung der Seite
  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/authentication']);
      return;
    }
    this.loadMe();
  }

  // Authorization Header (ohne Bearer)
  private headers() {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }

  // Koordinaten in Adresse umwandeln
  private updateAddressFromLocation(location: GeoJsonPoint | null) {
    if (!location?.coordinates) {
      this.addressLabel = '';
      this.isAddressLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const [lng, lat] = location.coordinates;

    this.isAddressLoading = true;
    this.cdr.detectChanges();

    this.mapService.getAddressFromPosition(lat, lng).subscribe({
      next: (address) => {
        this.addressLabel = address || `${lat}, ${lng}`;
        this.isAddressLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.addressLabel = `${lat}, ${lng}`;
        this.isAddressLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Userdaten aus DB laden
  private loadMe() {
    this.http.get<any>(`${this.API}/me`, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.user = res.user;
        this.authService.currentUser.set(res.user);

        this.edit.email = this.user?.email ?? '';
        this.edit.username = this.user?.username ?? '';
        this.edit.location = this.user?.location ?? null;

        this.updateAddressFromLocation(this.user?.location ?? null);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('LOAD /me ERROR', err);
        alert(err.error?.error || 'Session invalid. Please login again.');
        this.doLogout();
      },
    });
  }

  // Edit-Modus starten
  startEdit() {
    this.isEditing = true;
    this.isChangingPassword = false;

    this.edit.email = this.user?.email ?? '';
    this.edit.username = this.user?.username ?? '';
    this.edit.location = this.user?.location ?? null;

    this.updateAddressFromLocation(this.edit.location);
    this.cdr.detectChanges();
  }

  // Edit-Modus abbrechen
  cancelEdit() {
    this.isEditing = false;
    this.isChangingPassword = false;

    this.pw = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

    this.edit.email = this.user?.email ?? '';
    this.edit.username = this.user?.username ?? '';
    this.edit.location = this.user?.location ?? null;

    this.updateAddressFromLocation(this.user?.location ?? null);
    this.cdr.detectChanges();
  }

  // Neue Location aus Map übernehmen
  onLocationSelected(data: any) {
    this.edit.location = data?.geojson ?? null;
    this.updateAddressFromLocation(this.edit.location);
    this.cdr.detectChanges();
  }

  // Profildaten speichern
  saveProfile() {
    if (!this.edit.email || !this.edit.username) {
      alert('Please enter email and username.');
      return;
    }
    if (!this.edit.location) {
      alert('Please select location.');
      return;
    }

    const payload = {
      email: this.edit.email,
      username: this.edit.username,
      location: this.edit.location,
    };

    this.http.patch<any>(`${this.API}/me`, payload, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.user = res.user;
        this.authService.currentUser.set(res.user);

        this.isEditing = false;
        this.updateAddressFromLocation(this.user?.location ?? null);

        this.cdr.detectChanges();
        alert('Profile updated!');
      },
      error: (err) => {
        console.log('PATCH /me ERROR', err);
        alert(err.error?.error || 'Update failed');
      },
    });
  }

  // Passwort-Änderung anzeigen/verstecken
  togglePasswordChange() {
    this.isChangingPassword = !this.isChangingPassword;
    this.pw = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
    this.cdr.detectChanges();
  }

  // Passwort ändern
  changePassword() {
    if (!this.pw.currentPassword || !this.pw.newPassword) {
      alert('Please fill current and new password.');
      return;
    }
    if (this.pw.newPassword !== this.pw.confirmNewPassword) {
      alert('New passwords do not match.');
      return;
    }

    const payload = {
      currentPassword: this.pw.currentPassword,
      newPassword: this.pw.newPassword,
    };

    this.http.patch<any>(`${this.API}/me/password`, payload, { headers: this.headers() }).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.pw = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

        this.cdr.detectChanges();
        alert('Password changed!');
      },
      error: (err) => {
        console.log('PATCH /me/password ERROR', err);
        alert(err.error?.error || 'Password change failed');
      },
    });
  }

  // Logout
  doLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  get navbarRole(): 'user' | 'owner' | 'manager' {
    const t = this.user?.user_type;
    if (t === 'Admin') return 'manager';
    if (t === 'Restaurant') return 'owner';
    return 'user';
  }
}
