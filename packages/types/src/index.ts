export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description: string | null;
  isbn: string;
  price: string;
  stock_quantity: number;
  cover_image: string | null;
  rating: string;
  review_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  categories: Category[];
}

export interface BookListItem {
  id: number;
  title: string;
  author: string;
  price: string;
  stock_quantity: number;
  cover_image: string | null;
  rating: string;
  review_count: number;
  categories: Category[];
}

export interface CartItem {
  id: number;
  book_id: number;
  quantity: number;
  added_at: string;
  expires_at: string;
  book: BookListItem;
}

export interface Cart {
  items: CartItem[];
  total_items: number;
  subtotal: string;
}

export interface OrderItem {
  id: number;
  book_id: number;
  quantity: number;
  price_at_purchase: string;
  book_title: string | null;
  book_author: string | null;
  book_cover_image: string | null;
  book?: BookListItem;
}

export interface OrderTracking {
  order_id: number;
  current_status: OrderStatus;
  status_history: OrderStatusHistory[];
}

export interface OrderStatusHistory {
  id: number;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'shipped' | 'completed';

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  total_amount: string;
  shipping_address: string;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface OrderListItem {
  id: number;
  status: OrderStatus;
  total_amount: string;
  created_at: string;
  item_count: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  reviewer_name: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Analytics {
  total_orders: number;
  total_revenue: string;
  pending_orders: number;
  total_books: number;
  total_users: number;
  total_reviews: number;
}
