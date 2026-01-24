import { Component, inject, Input } from '@angular/core';
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

  isSubmitting = false;

  get cartItems() { return this.cartService.cartItems; }
  get totalPrice() { return this.cartService.totalPrice; }

  checkout() {
    if (this.cartItems().length === 0) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/authentication']);
      return;
    }

    const user = this.authService.currentUser();

    if (!user || !user.id) {
      this.authService.logout();
      return;
    }

    this.isSubmitting = true;

    this.cartService.placeOrder(user.id, this.restaurantId).subscribe({
      next: (response) => {
        console.log('Order created:', response);
        alert(`Order placed successfully! ID: ${response.orderId}`);
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Checkout error:', error);
        alert('Failed to place order. Please try again.');
        this.isSubmitting = false;
      }
    });
  }
}
