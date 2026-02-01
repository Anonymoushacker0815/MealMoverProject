import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-item.html'
})
export class MenuItemComponent {
  @Input() dish: any;
  private cartService = inject(CartService);


  private baseUrl = 'http://localhost:3000';


  getFullImageUrl(path: string | null): string | null {
    if (!path) return null;
    return `${this.baseUrl}${path}`;
  }

  addToBasket() {
    this.cartService.addToCart(this.dish);
  }
}
