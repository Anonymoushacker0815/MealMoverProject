import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './basket.html'
})
export class BasketComponent {
  protected cartService = inject(CartService);
  protected authService = inject(AuthService);
  private router = inject(Router);

  @Input() restaurantId!: number;
  @Input() isSummary = false;

  @Output() orderPlaced = new EventEmitter<number>();

  isSubmitting = false;

  get cartItems() { return this.cartService.cartItems; }
  get totalPrice() { return this.cartService.totalPrice; }

  handleAction() {
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

    this.cartService.placeOrder(user.id, this.restaurantId).subscribe({
      next: (response) => {
        console.log('Order created:', response);
        this.cartService.clearCart();
        this.isSubmitting = false;

        this.orderPlaced.emit(response.orderId);
      },
      error: (error) => {
        console.error('Checkout error:', error);
        alert('Failed to place order. Please try again.');
        this.isSubmitting = false;
      }
    });
  }
}
