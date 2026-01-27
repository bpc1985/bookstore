'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const { cart, isLoading, fetchCart, updateItem, removeItem, clearCart } = useCartStore();

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (user) {
      fetchCart(api);
    }
  }, [user, fetchCart]);

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    try {
      await updateItem(api, itemId, newQuantity);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(api, itemId);
      toast.success('Item removed');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart(api);
      toast.success('Cart cleared');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!isInitialized || !user) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        {cart && cart.items.length > 0 && (
          <Button variant="outline" onClick={handleClearCart} disabled={isLoading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        )}
      </div>

      {!cart || cart.items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Looks like you haven&apos;t added any books yet.
          </p>
          <Link href="/books">
            <Button>Browse Books</Button>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-32 bg-muted rounded-md flex items-center justify-center shrink-0 relative overflow-hidden">
                      {item.book.cover_image ? (
                        <Image
                          src={item.book.cover_image}
                          alt={item.book.title}
                          fill
                          sizes="96px"
                          className="object-cover rounded-md"
                        />
                      ) : (
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/books/${item.book.id}`}>
                        <h3 className="font-semibold hover:text-primary transition-colors">
                          {item.book.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{item.book.author}</p>
                      <p className="font-bold mt-2">${item.book.price}</p>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isLoading}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.book.stock_quantity || isLoading}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ${(parseFloat(item.book.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({cart.total_items})</span>
                  <span>${cart.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${cart.subtotal}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/checkout" className="w-full">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
