import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../components/navbar/navbar';

type OrderItem = {
  name: string;
  quantity: number;
};

type OrderStatus = 'new' | 'preparing' | 'ready' | 'complete';

type Order = {
  id: string;
  customerName: string;
  address: string;
  status: OrderStatus;
  items: OrderItem[];
};

@Component({
  standalone: true,
  selector: 'app-owner-orders',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './orders.html',
})
export class OwnerOrders {
  activeFilter: 'all' | OrderStatus = 'all';
  searchTerm = '';

  // Beispiel-Orders
  orders: Order[] = [
    {
      id: 'ORDER-0001',
      customerName: 'John Doe',
      address: 'Main Street 12',
      status: 'new',
      items: [
        { name: 'Burger', quantity: 2 },
        { name: 'Chicken Strips', quantity: 1 },
      ],
    },
    {
      id: 'ORDER-0002',
      customerName: 'Jane Smith',
      address: 'Park Avenue 5',
      status: 'new',
      items: [
        { name: 'Pizza', quantity: 1 },
        { name: 'Fries', quantity: 2 },
      ],
    },
    {
      id: 'ORDER-0003',
      customerName: 'Alex Brown',
      address: 'Sunset Blvd 99',
      status: 'new',
      items: [{ name: 'Pasta', quantity: 1 }],
    },
  ];

  // ---------- Filter ----------
  setFilter(filter: 'all' | OrderStatus) {
    this.activeFilter = filter;
  }

  filteredOrders(): Order[] {
    return this.orders.filter(order => {
      const matchesFilter =
        this.activeFilter === 'all' || order.status === this.activeFilter;

      const q = this.searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }

  // ---------- Status Actions ----------
  startPreparing(order: Order) {
    order.status = 'preparing';
  }

  markReady(order: Order) {
    order.status = 'ready';
  }

  completeOrder(order: Order) {
    order.status = 'complete';
  }

  rejectOrder(orderId: string) {
    this.orders = this.orders.filter(o => o.id !== orderId);
  }

  // ---------- Helpers ----------
  statusLabel(status: OrderStatus): string {
    return status.toUpperCase();
  }
}
