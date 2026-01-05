import { Injectable, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isLoggedIn = signal<boolean>(!!localStorage.getItem('token'));
  currentUser = signal<any>(this.getUserFromStorage());


  login(token: string) {
    localStorage.setItem('token', token);
    const decodedUser = this.decodeToken(token);
    localStorage.setItem('user', JSON.stringify(decodedUser));
    this.currentUser.set(decodedUser);
    this.isLoggedIn.set(true);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
  }

  private getUserFromStorage() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decoding token', error);
      return null;
    }
  }


}

