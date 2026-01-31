import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserMap } from '../../components/user-map/user-map';
import zxcvbn from 'zxcvbn';


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
  username = '';
  isSelectingRole = false;

  passwordStrengthScore = 0;
  passwordFeedback = '';
  passwordSuggestions: string[] = [];

  tempGeoJson: any = null;

  private http: HttpClient = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);


  onPasswordChange() {
    if (!this.password) {
      this.passwordStrengthScore = 0;
      this.passwordFeedback = '';
      this.passwordSuggestions = [];
      return;
    }

    const result = zxcvbn(this.password);
    this.passwordStrengthScore = result.score;
    this.passwordFeedback = result.feedback.warning;
    this.passwordSuggestions = result.feedback.suggestions;
  }


  get strengthColor(): string {
    switch (this.passwordStrengthScore) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-red-400';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  }

  onLocationSelected(data: any) {
    this.tempGeoJson = data.geojson;
  }

  private handleAuthSuccess(response: any) {
    console.log('Server Response:', response);
    this.authService.login(response.token);
    console.log('user_type:', response?.user?.user_type);
    const userType = response?.user?.user_type;

    if (userType === 'Admin') {
      this.router.navigate(['/manager/dashboard']);
      return;
    }
    if (userType === 'Restaurant') {
      this.router.navigate(['/owner/orders']);
      return;
    }
    if (userType === 'Customer') {
      this.router.navigate(['/user/order']);
      return;
    }
      this.router.navigate(['/account']);
    }

  onRegisterClick() {
    if (!this.email || !this.password) {
      alert("Please enter both email and password.");
      return;
    }

    if (this.password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    if (this.passwordStrengthScore < 2) {
      alert("Your password is too weak. Please follow the suggestions.");
      return;
    }

    this.isSelectingRole = true;
  }

  onRegister(role: string) {

    if (!this.username) {
      alert("Please enter a username.");
      return;
    }

    if (!this.tempGeoJson) {
      alert("Please select location.");
      return;
    }

    const payload = {
      username: this.username,
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
    this.username = '';
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
