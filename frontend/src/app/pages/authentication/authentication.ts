import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { UserMap } from '../../components/user-map/user-map';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [CommonModule, FormsModule, UserMap],
  templateUrl: './authentication.html',
  styleUrl: './authentication.css',
})
export class Authentication {
  email = '';
  password = '';
  isSelectingRole = false;


  tempGeoJson: any = null;

  private http: HttpClient = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);


  onLocationSelected(data: any) {
    this.tempGeoJson = data.geojson;
  }

  private handleAuthSuccess(response: any) {
    console.log('Server Response:', response);
    this.authService.login(response.token);
    alert('Authentication Successful!');
    this.router.navigate(['/account']);
  }

  onRegisterClick() {
    if (!this.email || !this.password) {
      alert("Please enter both email and password.");
      return;
    }
    this.isSelectingRole = true;
  }

  onRegister(role: string) {
    if (!this.tempGeoJson) {
      alert("Please select location.");
      return;
    }

    const payload = {
      email: this.email,
      password: this.password,
      user_type: role,
      location: this.tempGeoJson
    };

    this.http.post<any>('http://localhost:3000/register', payload)
      .subscribe({
        next: (res) => this.handleAuthSuccess(res),
        error: (err) => {
          alert(err.error?.error || 'Registration Failed');
        }
      });
  }

  cancelRoleSelection() {
    this.isSelectingRole = false;
    this.tempGeoJson = null;
  }

  onLogin() {
    if (!this.email || !this.password) return;

    this.http.post<any>('http://localhost:3000/login', { email: this.email, password: this.password })
      .subscribe({
        next: (res) => this.handleAuthSuccess(res),
        error: (err) => alert(err.error?.error || 'Login Failed')
      });
  }



}
