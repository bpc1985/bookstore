'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Package, Clock, CheckCircle, XCircle, Truck, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Order, OrderTracking } from '@/types';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' as const, color: 'text-yellow-600 bg-yellow-100' },
  paid: { label: 'Paid', icon: CreditCard, variant: 'default' as const, color: 'text-blue-600 bg-blue-100' },
  shipped: { label: 'Shipped', icon: Truck, variant: 'default' as const, color: 'text-purple-600 bg-purple-100' },
  completed: { label: 'Completed', icon: CheckCircle, variant: 'default' as const, color: 'text-green-600 bg-green-100' },
  cancelled: { label: 'Cancelled', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600 bg-red-100' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

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
        const [orderData, trackingData] = await Promise.all([
          api.getOrder(orderId),
          api.getOrderTracking(orderId),
        ]);
        setOrder(orderData);
        setTracking(trackingData);
      } catch (error) {
        toast.error('Failed to load order');
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [user, orderId, router]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const updatedOrder = await api.cancelOrder(order.id);
      setOrder(updatedOrder);
      const trackingData = await api.getOrderTracking(orderId);
      setTracking(trackingData);
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isInitialized || !user || isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <Link href="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  const canCancel = order.status === 'pending';

  return (
    <div className="container py-8">
      <Link href="/orders" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Badge variant={status.variant} className="gap-1 text-base px-4 py-2">
          <StatusIcon className="h-4 w-4" />
          {status.label}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {order.items.map((item) => (
                 <div key={item.id} className="flex gap-4">
                   <div className="w-20 h-28 bg-muted rounded-md flex items-center justify-center shrink-0 overflow-hidden relative">
                    {item.book_cover_image ? (
                      <Image
                        src={item.book_cover_image}
                        alt={item.book_title || 'Book'}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                   <div className="flex-1">
                     <h3 className="font-semibold">
                       {item.book_title || 'Book (no longer available)'}
                     </h3>
                     {item.book_author && <p className="text-sm text-muted-foreground">{item.book_author}</p>}
                     <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold">${item.price_at_purchase}</p>
                     <p className="text-sm text-muted-foreground">each</p>
                   </div>
                 </div>
               ))}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          {tracking && tracking.status_history && tracking.status_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tracking.status_history.map((event, index) => {
                    const eventStatus = statusConfig[event.status];
                    const EventIcon = eventStatus.icon;
                    const isLast = index === tracking.status_history.length - 1;
                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`p-2 rounded-full ${eventStatus.color}`}>
                            <EventIcon className="h-4 w-4" />
                          </div>
                          {!isLast && <div className="w-0.5 h-full bg-border mt-2" />}
                        </div>
                        <div className="pb-4">
                          <p className="font-medium">{eventStatus.label}</p>
                          {event.note && <p className="text-sm text-muted-foreground">{event.note}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items ({order.items.length})</span>
                <span>${order.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${order.total_amount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm">{order.shipping_address}</p>
            </CardContent>
          </Card>

          {/* Actions */}
          {canCancel && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
