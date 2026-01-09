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
export class OwnerOrders {

  activeFilter: 'all' | 'new' | 'preparing' | 'ready' | 'complete' = 'all';

  setFilter(filter: 'all' | 'new' | 'preparing' | 'ready' | 'complete') {
    this.activeFilter = filter;
  }

}