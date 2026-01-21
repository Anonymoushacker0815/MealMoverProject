import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './restaurant-card.html'
})
export class RestaurantCard {
  @Input() restaurant: any;
  private router = inject(Router);

  openMenu() {
    this.router.navigate(['/user/order/menu', this.restaurant.id]);
  }
}
