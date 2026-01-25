import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

// Dish Model
type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
};

// Category Model
type Category = {
  id: number;
  name: string;
  dishes: Dish[];
};

@Component({
  standalone: true,
  selector: 'app-owner-menu',
  imports: [CommonModule, FormsModule, Navbar, DragDropModule],
  templateUrl: './menu.html',
})
export class OwnerMenu implements OnInit {
  // Angular Services
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // Backend Base URL
  private baseUrl = 'http://localhost:3000';

  // UI Search
  searchTerm = '';

  // Add Category UI
  showAddCategory = false;
  newCategoryName = '';

  // Add Dish UI
  openDishFormForCategoryId: number | null = null;
  newDish: { name: string; description: string; price: number | null } = {
    name: '',
    description: '',
    price: null,
  };

  // Menu Data
  categories: Category[] = [];
  isLoading = false;

  // Saving State
  isSavingCategoryOrder = false;
  isSavingDishOrder = false;

  // Anti-Stuck: Request Tokens
  private categoryReorderReqToken = 0;
  private dishReorderReqToken = 0;

  // Lifecycle
  ngOnInit(): void {
    this.loadMenu();
  }

  // Auth Header Helper
  private authHeaders() {
    const token = localStorage.getItem('token') ?? '';
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  // Menü laden
  loadMenu() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.get<Category[]>(`${this.baseUrl}/owner/menu`, this.authHeaders()).subscribe({
      next: (data) => {
        this.categories = (data || []).map((c) => ({
          ...c,
          dishes: (c.dishes || []).map((d) => ({
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

  // Category Form Toggle
  toggleAddCategory() {
    this.showAddCategory = !this.showAddCategory;
    if (!this.showAddCategory) this.newCategoryName = '';
    this.cdr.detectChanges();
  }

  // Category hinzufügen
  addCategory() {
    const name = this.newCategoryName.trim();
    if (!name) return;

    this.http
      .post<Category>(`${this.baseUrl}/owner/categories`, { name }, this.authHeaders())
      .subscribe({
        next: () => {
          this.newCategoryName = '';
          this.showAddCategory = false;
          this.cdr.detectChanges();
          this.loadMenu();
        },
        error: (err) => {
          console.error(err);
          this.cdr.detectChanges();
          alert(err.error?.error || 'Could not add category');
        },
      });
  }

  // Category löschen
  removeCategory(categoryId: number) {
    this.http
      .delete<void>(`${this.baseUrl}/owner/categories/${categoryId}`, this.authHeaders())
      .subscribe({
        next: () => {
          if (this.openDishFormForCategoryId === categoryId) {
            this.openDishFormForCategoryId = null;
            this.resetDishForm();
          }
          this.cdr.detectChanges();
          this.loadMenu();
        },
        error: (err) => {
          console.error(err);
          this.cdr.detectChanges();
          alert(err.error?.error || 'Could not delete category');
        },
      });
  }

  // Category Drag&Drop speichern
  dropCategory(event: CdkDragDrop<Category[]>) {
    if (this.searchTerm.trim()) return;

    moveItemInArray(this.categories, event.previousIndex, event.currentIndex);
    this.cdr.detectChanges();

    const orderedIds = this.categories.map((c) => c.id);

    // Saving Badge an
    this.isSavingCategoryOrder = true;
    this.cdr.detectChanges();

    // Token erhöhen
    const myToken = ++this.categoryReorderReqToken;

    this.http
      .patch(`${this.baseUrl}/owner/categories/reorder`, { orderedIds }, this.authHeaders())
      .subscribe({
        next: () => {
          // ok
        },
        error: (err) => {
          console.error(err);

          if (myToken === this.categoryReorderReqToken) {
            this.isSavingCategoryOrder = false;
            this.cdr.detectChanges();
          }

          alert(err.error?.error || 'Could not save category order');
          this.loadMenu();
        },
        complete: () => {
          if (myToken === this.categoryReorderReqToken) {
            this.isSavingCategoryOrder = false;
            this.cdr.detectChanges();
          }
        },
      });
  }

  // Dish Form
  toggleDishForm(categoryId: number) {
    if (this.openDishFormForCategoryId === categoryId) {
      this.openDishFormForCategoryId = null;
      this.resetDishForm();
      this.cdr.detectChanges();
      return;
    }

    this.openDishFormForCategoryId = categoryId;
    this.resetDishForm();
    this.cdr.detectChanges();
  }

  // Dish hinzufügen
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
          this.cdr.detectChanges();
          this.loadMenu();
        },
        error: (err) => {
          console.error(err);
          this.cdr.detectChanges();
          alert(err.error?.error || 'Could not add dish');
        },
      });
  }

  // Dish löschen
  removeDish(_categoryId: number, dishId: number) {
    this.http
      .delete<void>(`${this.baseUrl}/owner/dishes/${dishId}`, this.authHeaders())
      .subscribe({
        next: () => {
          this.cdr.detectChanges();
          this.loadMenu();
        },
        error: (err) => {
          console.error(err);
          this.cdr.detectChanges();
          alert(err.error?.error || 'Could not delete dish');
        },
      });
  }

  // Dish Drag&Drop speichern
  dropDish(cat: Category, event: CdkDragDrop<Dish[]>) {
    if (this.searchTerm.trim()) return;

    moveItemInArray(cat.dishes, event.previousIndex, event.currentIndex);
    this.cdr.detectChanges();

    const orderedDishIds = cat.dishes.map((d) => d.id);

    this.isSavingDishOrder = true;
    this.cdr.detectChanges();

    const myToken = ++this.dishReorderReqToken;

    this.http
      .patch(
        `${this.baseUrl}/owner/categories/${cat.id}/dishes/reorder`,
        { orderedDishIds },
        this.authHeaders()
      )
      .subscribe({
        next: () => {
        },
        error: (err) => {
          console.error(err);

          if (myToken === this.dishReorderReqToken) {
            this.isSavingDishOrder = false;
            this.cdr.detectChanges();
          }

          alert(err.error?.error || 'Could not save dish order');
          this.loadMenu();
        },
        complete: () => {
          if (myToken === this.dishReorderReqToken) {
            this.isSavingDishOrder = false;
            this.cdr.detectChanges();
          }
        },
      });
  }

  // Suche / Filter
  filteredCategories(): Category[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.categories;

    return this.categories
      .map((cat) => {
        const catMatch = cat.name.toLowerCase().includes(q);
        const dishesMatch = cat.dishes.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q)
        );

        if (catMatch) return cat;
        if (dishesMatch.length) return { ...cat, dishes: dishesMatch };
        return null;
      })
      .filter((c): c is Category => c !== null);
  }

  // trackBy Helpers
  trackByCategoryId = (_: number, item: Category) => item.id;
  trackByDishId = (_: number, item: Dish) => item.id;

  // Dish Form Reset
  private resetDishForm() {
    this.newDish = { name: '', description: '', price: null };
  }
}
