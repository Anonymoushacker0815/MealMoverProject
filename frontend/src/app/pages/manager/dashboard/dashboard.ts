import { Component,OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

type Income = {
  amount: number;
}

type UserCount = {
  status: string;
  count: number;
}

type PendingRegs = {
  name: string;
  email: string;
  phone: string;
}

type OrderStats = {
  id: number;
  count: number;
  sum: number;
}

type Restaurant = {
  id: number;
  name: string;
  email: string;
  phone: string;
  opening_hours: string;
  status: string;
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class ManagerDashboard {

}
