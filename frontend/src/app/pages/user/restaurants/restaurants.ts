import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../services/restaurant.service';
import { RestaurantCard } from '../../../components/restaurant-card/restaurant-card';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [FormsModule, RestaurantCard],
  templateUrl: './restaurants.html'
})
export class Restaurants implements OnInit {
  private restaurantService = inject(RestaurantService);
  private cdr = inject(ChangeDetectorRef);

  allRestaurants: any[] = [];
  restaurants: any[] = [];
  categories: any[] = [];

  searchQuery: string = '';
  isLoading = true;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;


    this.restaurantService.getAllRestaurants().subscribe({
      next: (data) => {
        this.allRestaurants = data;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.isLoading = false; }
    });


    this.restaurantService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading categories', err)
    });
  }

  applyFilter() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.restaurants = [...this.allRestaurants];
    } else {
      this.restaurants = this.allRestaurants.filter(rest =>
        rest.name.toLowerCase().includes(query) ||
        (rest.delivery_zone && rest.delivery_zone.toLowerCase().includes(query))
      );
    }
  }
}
