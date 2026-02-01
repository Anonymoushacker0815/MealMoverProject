/*
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
//import { LoayltyService } from '../../../services/loyalty.service';

type UserLoyalty = {
  id: number;
  username: string|null;
  email: string;
  loyalty_points: number;
}

@Component({
  standalone: true,
  selector: 'app-loyalty',
    imports: [Navbar],
  templateUrl: './loyalty.html',
  styleUrl: './loyalty.css',
})
export class Loyalty implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

 // private loy = inject(LoayltyService);

  points = 0;
  money = this.points/200;

  userLoyalty: UserLoyalty = {
    id: -1,
    username: "",
    email: "",
    loyalty_points: 0
  };
   private API = 'http://loacalhost:3000';

    private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: token });
  }

  ngOnInit(): void {
    console.log(this.auth.currentUser);
    this.getLoyalty(3).subscribe({
      next: (rows) => {
        console.log('loaded points ', rows);
        this.userLoyalty = rows ?? 0
      }
    })
    this.points = 150;
    this.money = this.points/200;
  }
getLoyalty(id: number) {
    return this.http.get<UserLoyalty>(
        `${this.API}/user/loyalty/${id}`, 
        { headers: this.authHeaders() }
    )
  }
  handleAuthError(err: any) {
    if(err?.status === 401 || err?.status === 403) {
      this.router.navigate(['/authentication']);
      return true;
    }
    return false;
  }
}
*/

import { Component,OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserLoyalty } from '../../../services/loyalty.service';


@Component({
  standalone: true,
  selector: 'app-loyalty',
  imports: [Navbar],
  templateUrl: './loyalty.html',
  styleUrl: './loyalty.css',
})
export class Loyalty  implements OnInit{
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
 
  private mult = 100;
  points = 4;
  money = (this.points/this.mult).toFixed(2);
  private API = 'http://localhost:3000';

  ngOnInit() {
    this.getUserLoyalty(this.auth.currentUser().id);
  }

  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return {
      headers: new HttpHeaders({
        Authorization: token,
      }),
    };
  }

  getUserLoyalty(id:number){
    this.http.get<UserLoyalty[]>(
      `${this.API}/user/loyalty/${id}`, 
      this.getAuthHeaders()
    )
    .subscribe({
      next: (rows) => {
        this.points = rows[0].loyalty_points;
        this.money = (this.points/this.mult).toFixed(2);
        this.cdr.detectChanges();
      }
    })
  }

  updateLoyalty(id: number, amount: number) {
     const payload ={
        loyalty_points: amount
    };
    this.http.patch<any>(
        `${this.API}/user/loyalty/${id}`, 
        payload,
        this.getAuthHeaders()
    ).subscribe({
      next: (rows) => {
        this.points = amount;
        this.money = (this.points/this.mult).toFixed(2);
      }
    })
  }

  handleAuthError(err: any) {
    if(err?.status === 401 || err?.status === 403) {
      this.router.navigate(['/authentication']);
      return true;
    }
    return false;
  }
}
