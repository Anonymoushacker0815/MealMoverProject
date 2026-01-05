import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';

@Component({
  standalone: true,
  selector: 'app-owner-orders',
  imports: [CommonModule, Navbar],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OwnerOrders {}
