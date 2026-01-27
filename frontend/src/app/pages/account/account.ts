// ANGULAR CORE & CHANGE DETECTION
// Basisfunktionen für Komponenten, Lifecycle und manuelle UI-Updates
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';

// ANGULAR COMMON MODULES
// Grundlegende Direktiven und Template-Formulare
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ROUTING & HTTP
// Navigation zwischen Seiten sowie HTTP-Requests inkl. Headern
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// APP SERVICES & COMPONENTS
// Auth-Handling, Map-Komponente, Reverse-Geocoding Service und Navbar
import { AuthService } from '../../services/auth.service';
import { UserMap } from '../../components/user-map/user-map';
import { MapService } from '../../services/map.service';
import { Navbar } from '../../components/navbar/navbar';

// GEOJSON LOCATION MODEL
// Standort als GeoJSON Point (lng/lat) für DB und Map-Komponenten
type GeoJsonPoint = { type: 'Point'; coordinates: [number, number] };


// COMPONENT DEFINITION
// Standalone Account-Seite zum Anzeigen und Bearbeiten des User-Profils
@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, UserMap, Navbar],
  templateUrl: './account.html',
})
export class Account implements OnInit {

  // SERVICE INJECTIONS
  // HTTP für API, Router für Navigation, Auth für Session, MapService für Adresse, ChangeDetector für UI
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  private mapService = inject(MapService);
  private cdr = inject(ChangeDetectorRef);

  // BACKEND CONFIG
  // Basis-URL für alle Account-API Calls
  private API = 'http://localhost:3000';

  // USER STATE
  // Aktuell eingeloggter User
  user: any = null;

  // ADDRESS DISPLAY STATE
  // Menschlich lesbare Adresse + Ladezustand für Reverse-Geocoding
  addressLabel = '';
  isAddressLoading = false;

  // UI MODE STATE
  // Steuert ob gerade Profil bearbeitet wird oder Passwort geändert wird
  isEditing = false;
  isChangingPassword = false;

  // EDIT FORM MODEL
  // Temporäre Kopie der Profildaten für das Edit-Formular
  edit = {
    email: '',
    username: '',
    location: null as GeoJsonPoint | null,
  };

  // PASSWORD FORM MODEL
  // Temporäre Felder für Passwort-Änderung im UI
  pw = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };

  // LIFECYCLE INIT
  // Prüft Login-Status und lädt Userdaten beim Start
  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/authentication']);
      return;
    }
    this.loadMe();
  }

  // AUTH HEADER HELPER
  // Baut Authorization Header aus lokal gespeichertem JWT (ohne Bearer Prefix)
  private headers() {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }

  // LOCATION -> ADDRESS
  // Wandelt Koordinaten per MapService in eine lesbare Adresse um
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

  // LOAD CURRENT USER
  // Lädt Userprofil aus DB über /me und synchronisiert Edit-Model + Address
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

  // START EDIT MODE
  // Aktiviert Edit-Modus und befüllt das Formular mit aktuellen Userdaten
  startEdit() {
    this.isEditing = true;
    this.isChangingPassword = false;

    this.edit.email = this.user?.email ?? '';
    this.edit.username = this.user?.username ?? '';
    this.edit.location = this.user?.location ?? null;

    this.updateAddressFromLocation(this.edit.location);
    this.cdr.detectChanges();
  }

  // CANCEL EDIT MODE
  // Bricht Edit-Modus ab, setzt Formulare zurück und zeigt wieder Originaldaten
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

  // MAP LOCATION PICKER
  // Übernimmt neue Location aus Map-Komponente ins Edit-Model
  onLocationSelected(data: any) {
    this.edit.location = data?.geojson ?? null;
    this.updateAddressFromLocation(this.edit.location);
    this.cdr.detectChanges();
  }

  // SAVE PROFILE
  // Validiert Eingaben und speichert Profiländerungen via PATCH /me
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

  // PASSWORD UI TOGGLE
  // Öffnet oder schließt den Passwort-Dialog und leert die Passwortfelder
  togglePasswordChange() {
    this.isChangingPassword = !this.isChangingPassword;
    this.pw = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
    this.cdr.detectChanges();
  }

  // CHANGE PASSWORD
  // Validiert neue Passwörter und sendet Änderung an PATCH /me/password
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

  // LOGOUT
  // Loggt aus und navigiert zur Startseite
  doLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // NAVBAR ROLE RESOLVER
  // Leitet UserType auf passende Navbar-Rolle um (user/owner/manager)
  get navbarRole(): 'user' | 'owner' | 'manager' {
    const t = this.user?.user_type;
    if (t === 'Admin') return 'manager';
    if (t === 'Restaurant') return 'owner';
    return 'user';
  }
}
