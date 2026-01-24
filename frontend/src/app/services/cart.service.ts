import {Injectable, computed, signal, inject} from '@angular/core';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cartItems = signal<CartItem[]>([]);

  totalPrice = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/user-restaurants/order';

  addToCart(dish: any) {
    this.cartItems.update(items => {
      const existing = items.find(i => i.id === dish.id);
      if (existing) {
        return items.map(i => i.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...items, { id: dish.id, name: dish.name, price: dish.price, quantity: 1 }];
    });
  }

  removeFromCart(dishId: number) {
    this.cartItems.update(items => items.filter(i => i.id !== dishId));
  }

  updateQuantity(dishId: number, change: number) {
    this.cartItems.update(items => {
      return items.map(item => {
        if (item.id === dishId) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      });
    });
  }

  clearCart() {
    this.cartItems.set([]);
  }


  placeOrder(customerId: number, restaurantId: number): Observable<any> {
    const payload = {
      customerId: customerId,
      restaurantId: restaurantId,
      price: this.totalPrice(),
      items: this.cartItems()
    };

    return this.http.post(this.apiUrl, payload).pipe(
      tap(() => {
        this.clearCart();
      })
    );
  }



}
