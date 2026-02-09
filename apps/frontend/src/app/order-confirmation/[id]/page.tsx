'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@bookstore/ui';
import { Card, CardContent } from '@bookstore/ui';
import { Separator } from '@bookstore/ui';
import { Skeleton } from '@bookstore/ui';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import type { Order } from '@/types';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderId = parseInt(params.id as string);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    async function fetchOrder() {
      if (!user) return;
      setIsLoading(true);
      try {
        const orderData = await api.getOrder(orderId);
        setOrder(orderData);
      } catch {
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [user, orderId, router]);

  if (!isInitialized || !user || isLoading) {
    return (
      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-6" />
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-48 mx-auto mb-8" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <Link href="/orders">
          <Button>View Your Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-muted-foreground text-lg">
            Your order has been placed successfully
          </p>
        </div>

        {/* Order Info Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-semibold text-lg">#{order.id}</p>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Order Items Summary */}
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold">Order Summary</h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.book?.title || 'Book'} x {item.quantity}
                  </span>
                  <span>${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator className="mb-4" />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${order.total_amount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Info */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Shipping To</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {order.shipping_address}
            </p>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-8 bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">What&apos;s Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• You will receive an email confirmation shortly</li>
              <li>• We will notify you when your order ships</li>
              <li>• Track your order status anytime from your account</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/orders/${order.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Package className="h-4 w-4 mr-2" />
              View Order Details
            </Button>
          </Link>
          <Link href="/books" className="flex-1">
            <Button className="w-full">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
