import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
};

type Category = {
  id: number;
  name: string;
  dishes: Dish[];
};

@Component({
  standalone: true,
  selector: 'app-owner-menu',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './menu.html',
})
export class OwnerMenu implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  private baseUrl = 'http://localhost:3000';

  // UI state
  searchTerm = '';
  showAddCategory = false;
  newCategoryName = '';

  openDishFormForCategoryId: number | null = null;
  newDish: { name: string; description: string; price: number | null } = {
    name: '',
    description: '',
    price: null,
  };

  categories: Category[] = [];
  isLoading = false;

  // Lifecycle
  ngOnInit(): void {
    this.loadMenu();
  }

  // Auth Header Helper
  private authHeaders() {
    const token =
      (this.auth as any).getToken?.() ||
      localStorage.getItem('token');

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  // LOAD MENU
  loadMenu() {
    this.isLoading = true;

    this.http
      .get<Category[]>(`${this.baseUrl}/owner/menu`, this.authHeaders())
      .subscribe({
        next: (data) => {
          this.categories = (data || []).map(c => ({
            ...c,
            dishes: (c.dishes || []).map(d => ({
              ...d,
              price: Number((d as any).price),
            })),
          }));

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.cdr.detectChanges();
          alert(`Could not load menu (${err.status}): ${err.error?.error || err.message}`);
        },
      });
  }

  // CATEGORY ACTIONS
  toggleAddCategory() {
    this.showAddCategory = !this.showAddCategory;
    if (!this.showAddCategory) this.newCategoryName = '';
  }

  addCategory() {
    const name = this.newCategoryName.trim();
    if (!name) return;

    this.http
      .post<Category>(
        `${this.baseUrl}/owner/categories`,
        { name },
        this.authHeaders()
      )
      .subscribe({
        next: () => {
          this.newCategoryName = '';
          this.showAddCategory = false;
          this.loadMenu();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.cdr.detectChanges();
          alert(err.error?.error || 'Could not add category');
        },
      });
  }

  removeCategory(categoryId: number) {
    this.http
      .delete<void>(
        `${this.baseUrl}/owner/categories/${categoryId}`,
        this.authHeaders()
      )
      .subscribe({
        next: () => {
          if (this.openDishFormForCategoryId === categoryId) {
            this.openDishFormForCategoryId = null;
            this.resetDishForm();
          }

          this.loadMenu();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.cdr.detectChanges();
          alert(err.error?.error || 'Could not delete category');
        },
      });
  }

  // DISH ACTIONS
  toggleDishForm(categoryId: number) {
    if (this.openDishFormForCategoryId === categoryId) {
      this.openDishFormForCategoryId = null;
      this.resetDishForm();
      return;
    }

    this.openDishFormForCategoryId = categoryId;
    this.resetDishForm();
  }

  addDish(categoryId: number) {
    const name = this.newDish.name.trim();
    const description = this.newDish.description.trim();
    const price = this.newDish.price;

    if (!name || !description || price === null || Number.isNaN(price)) return;

    this.http
      .post<Dish>(
        `${this.baseUrl}/owner/dishes`,
        { categoryId, name, description, price: Number(price) },
        this.authHeaders()
      )
      .subscribe({
        next: () => {
          this.openDishFormForCategoryId = null;
          this.resetDishForm();
          this.loadMenu();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.cdr.detectChanges();
          alert(err.error?.error || 'Could not add dish');
        },
      });
  }

  removeDish(categoryId: number, dishId: number) {
    this.http
      .delete<void>(
        `${this.baseUrl}/owner/dishes/${dishId}`,
        this.authHeaders()
      )
      .subscribe({
        next: () => {
          this.loadMenu();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.cdr.detectChanges();
          alert(err.error?.error || 'Could not delete dish');
        },
      });
  }

  // SEARCH / FILTER
  filteredCategories(): Category[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.categories;

    return this.categories
      .map(cat => {
        const catMatch = cat.name.toLowerCase().includes(q);
        const dishesMatch = cat.dishes.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
        );

        if (catMatch) return cat;
        if (dishesMatch.length) return { ...cat, dishes: dishesMatch };
        return null;
      })
      .filter((c): c is Category => c !== null);
  }

  // HELPERS
  trackByCategoryId = (_: number, item: Category) => item.id;
  trackByDishId = (_: number, item: Dish) => item.id;

  private resetDishForm() {
    this.newDish = { name: '', description: '', price: null };
  }
}
