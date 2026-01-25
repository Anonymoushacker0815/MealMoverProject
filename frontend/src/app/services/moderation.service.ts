import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export type UserStatus = 'Active' | 'Suspended';

export interface ModerationUser {
  id: number;
  email: string;
  username: string | null;
  user_type: 'Customer' | 'Restaurant' | 'Admin';
  status: UserStatus;
}

@Injectable({ providedIn: 'root' })
export class ModerationService {
  private readonly baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }

  getUsers() {
    return this.http.get<ModerationUser[]>(
      `${this.baseUrl}/moderation/users`,
      { headers: this.authHeaders() }
    );
  }

  updateUserStatus(userId: number, status: UserStatus) {
    return this.http.patch<{ ok: boolean; userId: number; status: UserStatus }>(
      `${this.baseUrl}/moderation/users/${userId}/status`,
      { status },
      { headers: this.authHeaders() }
    );
  }
}
