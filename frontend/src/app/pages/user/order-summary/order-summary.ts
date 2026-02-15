import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../../services/restaurant.service';
import { BasketComponent } from '../../../components/basket/basket';
import { UserMap } from '../../../components/user-map/user-map';
import { OrderStatusComponent } from '../../../components/order-status/order-status';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [BasketComponent, UserMap, OrderStatusComponent],
  templateUrl: './order-summary.html'
})
export class OrderSummary implements OnInit {
  private route = inject(ActivatedRoute);
  private restaurantService = inject(RestaurantService);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);

  restaurantId!: number;
  restaurant: any = null;
  restaurantCoords: { lat: number, lng: number } | null = null;
  currentDistance: number = 0;

  currentDistanceKm: number = 0;
  deliveryZoneKm: number = 0;
  isOutOfRange: boolean = false;

  loading = true;
  error = '';

  activeOrderId: number | null = null;

  loyaltyPoints!: number;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('restaurantId');
    const loyaltyP = this.route.snapshot.paramMap.get('loyaltyPoints');
    if (id) {
      this.restaurantId = Number(id);
      this.loyaltyPoints = Number(loyaltyP);
      this.loadData();
    }
  }


  onOrderSuccess(orderId: number) {
    this.activeOrderId = orderId;
    setTimeout(() => {
      const el = document.getElementById('status-section');
      if(el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  handleDistance(meters: number) {
    this.currentDistance = meters;

    this.currentDistanceKm = meters / 1000;


    if (this.deliveryZoneKm > 0) {
      this.isOutOfRange = this.currentDistanceKm > this.deliveryZoneKm;
    } else {
      this.isOutOfRange = false;
    }

    this.cdr.detectChanges();
  }

  loadData() {
    this.loading = true;
    this.restaurantService.getRestaurantMenu(this.restaurantId).subscribe({
      next: (data) => {
        this.restaurant = data.restaurant;
        this.deliveryZoneKm = this.restaurant.delivery_zone || 0;
        const loc = this.restaurant?.location;

        if (loc) {
          if (loc.coordinates && Array.isArray(loc.coordinates)) {
            this.restaurantCoords = {
              lng: loc.coordinates[0],
              lat: loc.coordinates[1]
            };
          } else if (loc.lat !== undefined && loc.lng !== undefined) {
            this.restaurantCoords = {
              lat: Number(loc.lat),
              lng: Number(loc.lng)
            };
          } else if (typeof loc === 'string' && loc.includes('(')) {
            const parts = loc.replace(/[()]/g, '').split(',');
            this.restaurantCoords = { lat: Number(parts[0]), lng: Number(parts[1]) };
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API Error', err);
        this.error = 'Failed to load restaurant';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
