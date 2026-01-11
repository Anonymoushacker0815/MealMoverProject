import { Injectable, signal,inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  isLoggedIn = signal<boolean>(!!localStorage.getItem('token'));
  currentUser = signal<any>(this.decodeToken(localStorage.getItem('token')));

  verifyUser() {
    return this.http.get<any>('http://localhost:3000/verifyuser').pipe(
      tap(response => {
        this.currentUser.set(response.user);
      })
    );
  }

  login(token: string) {
    localStorage.setItem('token', token);
    this.currentUser.set(this.decodeToken(token));
    this.isLoggedIn.set(true);
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
  }



  private decodeToken(token: string | null): any {
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decoding token', error);
      return null;
    }
  }


}

