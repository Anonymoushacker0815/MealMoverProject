import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './authentication.html',
  styleUrl: './authentication.css',
})


export class Authentication {
  email = '';
  password = '';
  isSelectingRole = false;


  private http: HttpClient = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);



  private handleAuthSuccess(response: any) {
    console.log('Server Response:', response);

    const userData = response.user || response.data;
    this.authService.login(response.token, userData);

    alert('Authentication Successful!');

    //  Redirect to Account Page
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
    const payload = { email: this.email, password: this.password, user_type: role };

    this.http.post<any>('http://localhost:3000/register', payload)
      .subscribe({
        next: (res) => this.handleAuthSuccess(res),
        error: (err) => {
          alert(err.error?.error || 'Registration Failed');
          this.isSelectingRole = false;
        }
      });
  }

  cancelRoleSelection() {
    this.isSelectingRole = false;
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
