import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../components/navbar/navbar';

type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
};

type Category = {
  id: string;
  name: string;
  dishes: Dish[];
};

@Component({
  standalone: true,
  selector: 'app-owner-menu',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './menu.html',
})
export class OwnerMenu {
  // Search
  searchTerm = '';

  // Add Category
  showAddCategory = false;
  newCategoryName = '';

  // Add Dish
  openDishFormForCategoryId: string | null = null;
  newDish: { name: string; description: string; price: number | null } = {
    name: '',
    description: '',
    price: null,
  };

  // Beispiel-Daten
  categories: Category[] = [
    {
      id: this.uid(),
      name: 'Appetizers',
      dishes: [
        { id: this.uid(), name: 'Fries', description: 'Crispy fries', price: 4.5 },
        { id: this.uid(), name: 'Onion Rings', description: 'Golden rings', price: 4.5 },
      ],
    },
    {
      id: this.uid(),
      name: 'Main Course',
      dishes: [{ id: this.uid(), name: 'Burger', description: 'Beef burger with cheese', price: 10.5 }],
    },
  ];

  // ---------- Category Actions ----------
  toggleAddCategory() {
    this.showAddCategory = !this.showAddCategory;
    if (!this.showAddCategory) this.newCategoryName = '';
  }

  addCategory() {
    const name = (this.newCategoryName || '').trim();
    if (!name) return;

    this.categories.push({
      id: this.uid(),
      name,
      dishes: [],
    });

    this.newCategoryName = '';
    this.showAddCategory = false;
  }

  removeCategory(categoryId: string) {
    this.categories = this.categories.filter(c => c.id !== categoryId);

    if (this.openDishFormForCategoryId === categoryId) {
      this.openDishFormForCategoryId = null;
      this.resetDishForm();
    }
  }

  // ---------- Dish Actions ----------
  toggleDishForm(categoryId: string) {
    if (this.openDishFormForCategoryId === categoryId) {
      this.openDishFormForCategoryId = null;
      this.resetDishForm();
      return;
    }
    this.openDishFormForCategoryId = categoryId;
    this.resetDishForm();
  }

  addDish(categoryId: string) {
    const name = (this.newDish.name || '').trim();
    const description = (this.newDish.description || '').trim();
    const price = this.newDish.price;

    if (!name || !description || price === null || Number.isNaN(price)) return;

    const cat = this.categories.find(c => c.id === categoryId);
    if (!cat) return;

    cat.dishes.unshift({
      id: this.uid(),
      name,
      description,
      price: Number(price),
    });

    this.openDishFormForCategoryId = null;
    this.resetDishForm();
  }

  removeDish(categoryId: string, dishId: string) {
    const cat = this.categories.find(c => c.id === categoryId);
    if (!cat) return;

    cat.dishes = cat.dishes.filter(d => d.id !== dishId);
  }

  // ---------- Search / Filter ----------
  filteredCategories(): Category[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.categories;

    return this.categories
      .map(cat => {
        const catMatch = cat.name.toLowerCase().includes(q);
        const dishesMatch = cat.dishes.filter(d =>
          d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
        );

        if (catMatch) return cat;
        if (dishesMatch.length > 0) return { ...cat, dishes: dishesMatch };
        return null;
      })
      .filter((c): c is Category => c !== null);
  }

  // ---------- helpers ----------
  trackByCategoryId = (_: number, item: Category) => item.id;
  trackByDishId = (_: number, item: Dish) => item.id;

  private resetDishForm() {
    this.newDish = { name: '', description: '', price: null };
  }

  private uid(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
