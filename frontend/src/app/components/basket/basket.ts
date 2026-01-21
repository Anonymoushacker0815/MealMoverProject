import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './basket.html'
})
export class BasketComponent {
  cartService = inject(CartService);

  checkout() {
    console.log( this.cartService.cartItems());
  }
}
