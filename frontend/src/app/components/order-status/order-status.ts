import { Component, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-status.html'
})
export class OrderStatusComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private router = inject(Router);
  private pollSubscription?: Subscription;
  private hasRedirected = false;

  @Input({ required: true }) orderId!: number;
  @Input({ required: true }) restaurantId!: number;

  status = signal<string>('placed');
  lastUpdated = signal<Date>(new Date());
  loading = signal<boolean>(true);

  steps = [
    { key: 'placed', label: 'Order Placed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'delivering', label: 'On the Way' },
    { key: 'completed', label: 'Delivered' }
  ];

  ngOnInit() {
    // Poll every 60 seconds typically but for debug every 5
    this.pollSubscription = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => this.cartService.getOrderStatus(this.orderId))
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.order) {
            this.status.set(res.order.status);
            this.lastUpdated.set(new Date());
            this.loading.set(false);

            if (!this.hasRedirected) {


              if (res.order.status === 'completed') {
                this.hasRedirected = true;
                setTimeout(() => {
                  this.router.navigate(['/user/order/review', this.restaurantId]);
                }, 2000);
              }


              if (res.order.status === 'rejected') {
                this.hasRedirected = true;
                setTimeout(() => {
                  this.router.navigate(['/user/order/restaurants']);
                }, 3000);
              }
            }
          }
        },
        error: (err) => console.error('Error polling order status', err)
      });
  }

  ngOnDestroy() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }

  getStepClass(stepKey: string): string {
    const current = this.status();

    if (current === 'rejected') return 'pending';

    const keys = this.steps.map(s => s.key);
    const currentIndex = keys.indexOf(current);
    const stepIndex = keys.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  }
}
