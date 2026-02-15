import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";

export type UserLoyalty = {
    id: number;
    email: string;
    username: string|null;
    loyalty_points: number;
}

@Injectable({ providedIn: 'root'})
export class LoyaltyService {
    private readonly API = 'http://localhost:3000';

    constructor(private http:HttpClient) {}

   private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return {
      headers: new HttpHeaders({
        Authorization: token,
      }),
    };
  }
  
  getLoyalty(id: number) {
    return this.http.get<UserLoyalty[]>(
        `${this.API}/user/loyalty/${id}`, this.getAuthHeaders()
    )
  }

  updateLoyalty(id: number, amount: number) {
   
    return this.http.patch<any>(
        `${this.API}/user/loyalty/${id}` ,
        {loyalty_points: amount},
        this.getAuthHeaders() 
    );
  }
}