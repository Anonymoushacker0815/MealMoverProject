import { Component, inject, Input, Output, EventEmitter } from '@angular/core';

import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { LoyaltyService } from '../../services/loyalty.service';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [],
  templateUrl: './basket.html'
})
export class BasketComponent {
  protected cartService = inject(CartService);
  protected authService = inject(AuthService);
  protected loyaltyService = inject(LoyaltyService);
  private router = inject(Router);

  @Input() restaurantId!: number;
  @Input() isSummary = false;

  @Input() isOutOfRange = false;
  @Output() orderPlaced = new EventEmitter<number>();

  @Input() loyaltyPoints!: number;

  isSubmitting = false;
  orderSuccess = false;

  get cartItems() { return this.cartService.cartItems; }
  get totalPrice() { return (this.cartService.totalPrice() - this.loyaltyPoints/100); }
  
  maxPoints = 0;
  maxPoint = this.loyaltyService.getLoyalty(3).subscribe({
      next: (rows) => {
         this.maxPoints = rows[0].loyalty_points;
      }
    });

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
      this.router.navigate(['/user/order/summary', this.restaurantId, this.loyaltyPoints]);
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

    this.updateLoyaltyPoints(this.totalPrice);
    this.cartService.placeOrder(user.id, this.restaurantId, this.loyaltyPoints).subscribe({
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
  private updateLoyaltyPoints(price: number){
    this.loyaltyService.updateLoyalty(this.authService.currentUser().id, (price-(price%10))-this.loyaltyPoints).subscribe({
      next: (response) => {
        console.log('points updated', response);
      }
      , error: (err) => {
        console.error('PointUpdate error: ', err);
      }
    });
  }

  addPoints() {
    if(this.loyaltyPoints+10 <= this.maxPoints && this.totalPrice -10/100 >= -0.000001)// (this.loyaltyPoints+10)/100)
    this.loyaltyPoints+=10;
  }
  removePoints(){
    if(this.loyaltyPoints-10>=0)
      this.loyaltyPoints-=10;
  }
}
