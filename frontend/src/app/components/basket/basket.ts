import { Component, inject, Input, Output, EventEmitter } from '@angular/core';

import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [],
  templateUrl: './basket.html'
})
export class BasketComponent {
  protected cartService = inject(CartService);
  protected authService = inject(AuthService);
  private router = inject(Router);

  @Input() restaurantId!: number;
  @Input() isSummary = false;

  @Input() isOutOfRange = false;
  @Output() orderPlaced = new EventEmitter<number>();

  isSubmitting = false;
  orderSuccess = false;

  get cartItems() { return this.cartService.cartItems; }
  get totalPrice() { return this.cartService.totalPrice; }

  handleAction() {
    if (this.isOutOfRange) return;
    if (this.cartItems().length === 0) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/authentication']);
      return;
    }

    if (this.isSummary) {
      this.placeOrder();
    } else {
      this.router.navigate(['/user/order/summary', this.restaurantId]);
    }
  }

  private placeOrder() {
    const user = this.authService.currentUser();

    if (!user || !user.id) {
      this.authService.logout();
      return;
    }

    this.isSubmitting = true;
    this.orderSuccess = false;

    this.cartService.placeOrder(user.id, this.restaurantId).subscribe({
      next: (response) => {
        console.log('Order created:', response);
        this.cartService.clearCart();
        this.isSubmitting = false;

        this.orderSuccess = true;

        this.orderPlaced.emit(response.orderId);
      },
      error: (error) => {
        console.error('Checkout error:', error);
        alert('Failed to place order. Please try again.');
        this.isSubmitting = false;
        this.orderSuccess = false;
      }
    });
  }
}
