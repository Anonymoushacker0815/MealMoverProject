import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../../services/restaurant.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review.html'
})
export class Review {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private restaurantService = inject(RestaurantService);
  private authService = inject(AuthService);

  rating = 0;
  details = '';
  isSubmitting = false;
  restaurantId: number | null = null;

  constructor() {
    const rId = this.route.snapshot.paramMap.get('restaurantId');
    if(rId) this.restaurantId = Number(rId);
  }

  setRating(star: number) {
    this.rating = star;
  }

  submit() {
    const user = this.authService.currentUser();

    if (!this.restaurantId || this.rating === 0 || !user || !user.id) {
      console.error("Missing submission data: User ID or Restaurant ID missing.");
      return;
    }

    this.isSubmitting = true;

    this.restaurantService.submitReview({
      userId: user.id,
      restaurantId: this.restaurantId,
      rating: this.rating,
      details: this.details
    }).subscribe({
      next: () => {
        this.router.navigate(['/user/order/restaurants']);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
      }
    });
  }

  skip() {
    this.router.navigate(['/user/order/restaurants']);
  }
}
