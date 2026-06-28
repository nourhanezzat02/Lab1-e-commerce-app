import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {

  private readonly apiUrl = 'http://localhost:3000/cart';

  private http = inject(HttpClient);

  cartItems = signal<CartItem[]>([]);

  cartCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  totalBeforeDiscount = computed(() =>
    this.cartItems().reduce(
      (sum, item) =>
        sum + item.product.originalPrice * item.quantity,
      0
    )
  );

  totalAfterDiscount = computed(() =>
    this.cartItems().reduce(
      (sum, item) =>
        sum + item.product.price * item.quantity,
      0
    )
  );

  totalSavings = computed(() =>
    this.totalBeforeDiscount() - this.totalAfterDiscount()
  );

  loadCart(): void {
    this.http.get<CartItem[]>(this.apiUrl)
      .subscribe(items => this.cartItems.set(items));
  }

  addToCart(product: Product): void {

    const existing = this.cartItems()
      .find(item => item.product.id === product.id);

    if (existing) {

      const updated = {
        ...existing,
        quantity: existing.quantity + 1
      };

      this.http.put<CartItem>(
        `${this.apiUrl}/${existing.product.id}`,
        updated
      ).subscribe(() => this.loadCart());

    } else {

      const item: CartItem = {
        product,
        quantity: 1
      };

      this.http.post<CartItem>(
        this.apiUrl,
        item
      ).subscribe(() => this.loadCart());
    }
  }

  updateQuantity(productId: number, quantity: number): void {

    const item = this.cartItems()
      .find(i => i.product.id === productId);

    if (!item) return;

    const updated = {
      ...item,
      quantity
    };

    this.http.put<CartItem>(
      `${this.apiUrl}/${productId}`,
      updated
    ).subscribe(() => this.loadCart());
  }

  removeFromCart(productId: number): void {
    this.http.delete(
      `${this.apiUrl}/${productId}`
    ).subscribe(() => this.loadCart());
  }

  clearCart(): void {

    this.cartItems().forEach(item => {

      this.http.delete(
        `${this.apiUrl}/${item.product.id}`
      ).subscribe();

    });

    this.cartItems.set([]);
  }

  isInCart(productId: number): boolean {
    return this.cartItems()
      .some(item => item.product.id === productId);
  }
}
