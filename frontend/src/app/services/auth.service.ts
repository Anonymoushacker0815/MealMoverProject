import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isLoggedIn = signal<boolean>(!!localStorage.getItem('token'));

  login(token: string, user: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.isLoggedIn.set(true);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}
