// ANGULAR CORE & LIFECYCLE
// Basisfunktionen für Komponenten, Lifecycle und Dependency Injection
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

// ANGULAR COMMON MODULES
// Grundlegende Direktiven und Formularunterstützung
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// UI COMPONENTS & SERVICES
// Navbar-Komponente sowie HTTP- und Authentifizierungsservices
import { Navbar } from '../../../components/navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

// ANGULAR CDK DRAG & DROP
// Funktionen für Drag-and-Drop von Kategorien und Gerichten
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';


// DISH MODEL
// Datenmodell für ein Gericht inklusive Bildpfad, Bild-URL und lokaler Vorschau
type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;

  picture_path?: string | null;
  pictureUrl?: string | null;
  _previewUrl?: string | null;
};


// CATEGORY MODEL
// Datenmodell für eine Kategorie mit zugehörigen Gerichten
type Category = {
  id: number;
  name: string;
  dishes: Dish[];
};


// COMPONENT DEFINITION
// Standalone-Komponente zur Menüverwaltung für Restaurant-Owner
@Component({
  standalone: true,
  selector: 'app-owner-menu',
  imports: [CommonModule, FormsModule, Navbar, DragDropModule],
  templateUrl: './menu.html',
})
export class OwnerMenu implements OnInit {

  // SERVICE INJECTIONS
  // HTTP für API-Aufrufe, Auth für Token, ChangeDetector für manuelle UI-Updates
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // BACKEND CONFIG
  // Basis-URL für API-Endpunkte und Bildzugriffe
  baseUrl = 'http://localhost:3000';

  // SEARCH STATE
  // Suchbegriff zum Filtern von Kategorien und Gerichten
  searchTerm = '';

  // CATEGORY FORM STATE
  // UI-Status und Eingabewert für neue Kategorien
  showAddCategory = false;
  newCategoryName = '';

  // DISH FORM STATE
  // Kategorie-ID, für die aktuell ein Gericht erstellt wird
  openDishFormForCategoryId: number | null = null;

  // NEW DISH DATA
  // Temporäre Eingabedaten für ein neues Gericht
  newDish: { name: string; description: string; price: number | null } = {
    name: '',
    description: '',
    price: null,
  };

  // MENU DATA
  // Geladene Kategorien inklusive aller Gerichte
  categories: Category[] = [];

  // LOADING STATE
  // Zeigt an, ob das Menü aktuell geladen wird
  isLoading = false;

  // SAVE STATES
  // Statusanzeigen für laufende Reorder-Operationen
  isSavingCategoryOrder = false;
  isSavingDishOrder = false;

  // IMAGE UPLOAD STATE
  // Verfolgt laufende Bild-Uploads pro Gericht
  uploadingDishImage: Record<number, boolean> = {};

  // REQUEST TOKENS
  // Schutz vor Race Conditions bei Reorder-Requests
  private categoryReorderReqToken = 0;
  private dishReorderReqToken = 0;

  // LIFECYCLE HOOK
  // Lädt das Menü beim Initialisieren der Komponente
  ngOnInit(): void {
    this.loadMenu();
  }

  // AUTH HEADER HELPER
  // Erstellt Authorization Header mit JWT für geschützte API-Endpunkte
  private authHeaders() {
    const token = localStorage.getItem('token') ?? '';
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  // MENU LOAD
  // Lädt Kategorien und Gerichte vom Backend und bereitet Bild-URLs auf
  loadMenu() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.get<Category[]>(`${this.baseUrl}/owner/menu`, this.authHeaders()).subscribe({
      next: (data: any) => {
        this.categories = (data || []).map((c: any) => ({
          ...c,
          dishes: (c.dishes || []).map((d: any) => {
            const picture_path = d.picture_path ?? null;
            return {
              ...d,
              price: Number(d.price),
              picture_path,
              pictureUrl: picture_path ? `${this.baseUrl}${picture_path}` : null,
            } as Dish;
          }),
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

  // CATEGORY FORM TOGGLE
  // Öffnet oder schließt das Formular zum Hinzufügen einer Kategorie
  toggleAddCategory() {
    this.showAddCategory = !this.showAddCategory;
    if (!this.showAddCategory) this.newCategoryName = '';
    this.cdr.detectChanges();
  }

  // CATEGORY CREATE
  // Erstellt eine neue Kategorie im Backend
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

  // CATEGORY DELETE
  // Löscht eine Kategorie inklusive aller enthaltenen Gerichte
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

  // CATEGORY REORDER
  // Speichert die neue Reihenfolge der Kategorien nach Drag & Drop
  dropCategory(event: CdkDragDrop<Category[]>) {
    if (this.searchTerm.trim()) return;

    moveItemInArray(this.categories, event.previousIndex, event.currentIndex);
    this.cdr.detectChanges();

    const orderedIds = this.categories.map((c) => c.id);

    this.isSavingCategoryOrder = true;
    this.cdr.detectChanges();

    const myToken = ++this.categoryReorderReqToken;

    this.http
      .patch(`${this.baseUrl}/owner/categories/reorder`, { orderedIds }, this.authHeaders())
      .subscribe({
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

  // DISH FORM TOGGLE
  // Öffnet oder schließt das Formular zum Hinzufügen eines Gerichts
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

  // DISH CREATE
  // Erstellt ein neues Gericht innerhalb einer Kategorie
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

  // DISH DELETE
  // Löscht ein einzelnes Gericht
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

  // DISH REORDER
  // Speichert die neue Reihenfolge der Gerichte innerhalb einer Kategorie
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

  // SEARCH FILTER
  // Filtert Kategorien und Gerichte anhand des Suchbegriffs
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

  // TRACKBY HELPERS
  // Optimiert Rendering bei Listen mit ngFor
  trackByCategoryId = (_: number, item: Category) => item.id;
  trackByDishId = (_: number, item: Dish) => item.id;

  // DISH FORM RESET
  // Setzt die Eingabefelder für ein neues Gericht zurück
  private resetDishForm() {
    this.newDish = { name: '', description: '', price: null };
  }

  // FILE INPUT HELPER
  // Öffnet das versteckte Datei-Auswahlfeld per Klick
  triggerDishFilePicker(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  // DISH IMAGE UPLOAD
  // Erstellt eine Vorschau und lädt das Bild zum Backend hoch
  onDishImageSelected(dish: Dish, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (dish._previewUrl) URL.revokeObjectURL(dish._previewUrl);
    dish._previewUrl = URL.createObjectURL(file);
    this.cdr.detectChanges();

    const form = new FormData();
    form.append('image', file);

    this.uploadingDishImage[dish.id] = true;
    this.cdr.detectChanges();

    this.http
      .post<{ picture_path: string }>(
        `${this.baseUrl}/owner/dishes/${dish.id}/picture`,
        form,
        this.authHeaders()
      )
      .subscribe({
        next: (res) => {
          dish.picture_path = res.picture_path;
          dish.pictureUrl = `${this.baseUrl}${res.picture_path}`;

          if (dish._previewUrl) {
            URL.revokeObjectURL(dish._previewUrl);
            dish._previewUrl = null;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.error || 'Could not upload image');
          this.cdr.detectChanges();
        },
        complete: () => {
          this.uploadingDishImage[dish.id] = false;
          input.value = '';
          this.cdr.detectChanges();
        },
      });
  }
}
