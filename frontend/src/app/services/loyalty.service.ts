import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";

export type UserLoyalty = {
    id: number;
    email: string;
    username: string|null;
    loyalty_points: number;
}

@Injectable({ providedIn: 'root'})
export class LoayltyService {
    private readonly API = 'http://loacalhost:3000';

    constructor(private http:HttpClient) {}

    private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }
  
  getLoyalty(id: number) {
    return this.http.get<UserLoyalty>(
        `${this.API}/user/loyalty/${id}`, 
        { headers: this.authHeaders() }
    )
  }

  updateLoyalty(id: number, amount: number) {
   
    return this.http.patch<any>(
        `${this.API}/user/loyalty/${id}` ,
        {loyalty_points: amount},
        { headers: this.authHeaders() }
    );
  }
}