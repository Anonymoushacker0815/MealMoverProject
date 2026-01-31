import { Component, Input, inject } from '@angular/core';

import { Router } from '@angular/router';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [],
  templateUrl: './restaurant-card.html'
})
export class RestaurantCard {
  @Input() restaurant: any;
  private router = inject(Router);

  private baseUrl = 'http://localhost:3000';

  getFullImageUrl(path: string | null): string | null {
    if (!path) return null;
    return `${this.baseUrl}${path}`;
  }
  openMenu() {
    this.router.navigate(['/user/order/menu', this.restaurant.id]);
  }
}
