import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/user-restaurants';

  getAllRestaurants(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getAllCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  getRestaurantMenu(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}/menu`);
  }

  submitReview(data: { userId: number, restaurantId: number, rating: number, details: string }) {
    return this.http.post(`${this.apiUrl}/review`, data);
  }
}
