import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../services/restaurant.service';
import { RestaurantCard } from '../../../components/restaurant-card/restaurant-card';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [ FormsModule, RestaurantCard],
  templateUrl: './restaurants.html'
})
export class Restaurants implements OnInit {
  private restaurantService = inject(RestaurantService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('categoryContainer') categoryContainer!: ElementRef<HTMLElement>;
  allRestaurants: any[] = [];
  restaurants: any[] = [];
  categories: any[] = [];

  searchQuery: string = '';
  selectedCategoryName: string | null = null;
  isSortMenuOpen = false;
  sortBy: 'rating' | 'name' = 'rating';
  isLoading = true;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    this.restaurantService.getAllCategories().subscribe({
      next: (data) => this.categories = data || [],
      error: (e) => console.error(e)
    });

    this.restaurantService.getAllRestaurants().subscribe({
      next: (data) => {
        this.allRestaurants = data || [];
        this.allRestaurants.forEach(r => {
          if (!r.categories) r.categories = [];
        });
        this.restaurants = [...this.allRestaurants];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error(e);
        this.isLoading = false;
      }
    });
  }



  selectCategory(catName: string) {
    if (this.selectedCategoryName === catName) {
      this.selectedCategoryName = null;
    } else {
      this.selectedCategoryName = catName;
    }
    this.applyFilter();
  }

  toggleSortMenu() {
    this.isSortMenuOpen = !this.isSortMenuOpen;
  }

  selectSort(option: 'rating' | 'name') {
    this.sortBy = option;
    this.isSortMenuOpen = false;
    this.applyFilter();
  }

  applyFilter() {
    let result = [...this.allRestaurants];

    const query = String(this.searchQuery || '').toLowerCase().trim();

    if (query.length > 0) {
      result = result.filter(rest => {
        const name = String(rest.name || '').toLowerCase();
        const zone = String(rest.delivery_zone || '').toLowerCase();
        return name.includes(query) || zone.includes(query);
      });
    }

    if (this.selectedCategoryName) {
      const target = this.selectedCategoryName;

      result = result.filter(rest => {
        if (!rest.categories || rest.categories.length === 0) return false;
        return this.doesCategoryMatch(rest.categories, target);
      });
    }

    if (this.sortBy === 'rating') {
      result.sort((a, b) => Number(b.average_rating) - Number(a.average_rating));
    } else {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    this.restaurants = result;
    this.cdr.detectChanges();
  }

  doesCategoryMatch(list: any[], targetName: string): boolean {
    return list.some(item => {
      if (typeof item === 'string') {
        return item === targetName;
      }
      if (typeof item === 'object' && item !== null) {
        const val = item.name || item.title || '';
        return val === targetName;
      }
      return false;
    });
  }

  scrollCategories(direction: 'left' | 'right') {
    if (!this.categoryContainer) return;
    const amount = 300;
    this.categoryContainer.nativeElement.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }
}
