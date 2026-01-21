import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule,Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { RestaurantService } from '../../../services/restaurant.service';
import { MenuItemComponent } from '../../../components/menu-item/menu-item';
import { BasketComponent } from '../../../components/basket/basket';

@Component({
  selector: 'app-order-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuItemComponent, BasketComponent],
  templateUrl: './menu.html'
})
export class Menu implements OnInit {
  private route = inject(ActivatedRoute);
  private restaurantService = inject(RestaurantService);
  private cdr = inject(ChangeDetectorRef);
  private location = inject(Location);

  restaurant: any = {};
  menuCategories: any[] = [];
  filteredCategories: any[] = [];

  searchQuery = '';
  selectedCategoryFilter = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMenu(Number(id));
    }
  }

  loadMenu(id: number) {
    this.restaurantService.getRestaurantMenu(id).subscribe({
      next: (data) => {
        this.restaurant = data.restaurant || {};
        this.menuCategories = data.menu || [];
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  toggleCategoryFilter(catName: string) {
    this.selectedCategoryFilter =
      this.selectedCategoryFilter === catName ? '' : catName;
    this.applyFilters();
  }

  applyFilters() {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query && !this.selectedCategoryFilter) {
      this.filteredCategories = [...this.menuCategories];
      return;
    }

    this.filteredCategories = this.menuCategories
      .map(cat => {
        const items = (cat.items || []).filter((item: any) => {
          return (
            item.name.toLowerCase().includes(query) ||
            (item.description || '').toLowerCase().includes(query)
          );
        });

        if (
          (!this.selectedCategoryFilter || cat.name === this.selectedCategoryFilter) &&
          items.length
        ) {
          return { ...cat, items };
        }

        return null;
      })
      .filter(Boolean);
  }


  goBack() {
    this.location.back();
  }
}
