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

  addToBasket() {
    this.cartService.addToCart(this.dish);
  }
}
