import { Component, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-status.html'
})
export class OrderStatusComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private pollSubscription?: Subscription;

  @Input({ required: true }) orderId!: number;

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
// Poll every 60 seconds typically but for debug every 20
    this.pollSubscription = interval(20000)
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
    const keys = this.steps.map(s => s.key);
    const currentIndex = keys.indexOf(current);
    const stepIndex = keys.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  }
}
