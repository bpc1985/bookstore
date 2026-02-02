'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, CheckCircle, XCircle, Truck, CreditCard, Loader2 } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { orderStatusSchema } from '@/lib/schemas';
import { useUpdateOrderStatusMutation } from '@/lib/hooks';
import { toast } from 'sonner';
import type { Order, OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
  paid: { label: 'Paid', icon: CreditCard, color: 'text-blue-600 bg-blue-100' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-600 bg-purple-100' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-100' },
};

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderId = parseInt(params.id as string);
  const updateStatusMutation = useUpdateOrderStatusMutation(orderId);

  const form = useForm({
    defaultValues: {
      status: '' as OrderStatus | '',
      note: '',
    },
    validators: {
      onSubmit: orderStatusSchema,
    },
    onSubmit: async ({ value }) => {
      if (!order || !value.status) return;
      try {
        const updatedOrder = await updateStatusMutation.mutateAsync({
          status: value.status as OrderStatus,
          note: value.note,
        });
        setOrder(updatedOrder);
        form.reset();
        toast.success('Order status updated');
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
  });

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      try {
        const data = await api.getAdminOrder(orderId);
        setOrder(data);
      } catch (error) {
        toast.error('Failed to load order');
        router.push('/admin/orders');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderId, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Link href="/admin/orders">
          <Button className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status];
  const CurrentStatusIcon = currentStatus.icon;
  const availableTransitions = statusTransitions[order.status];

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order #{order.id}</h2>
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
        <Badge className={`gap-1 text-base px-4 py-2 ${currentStatus.color}`}>
          <CurrentStatusIcon className="h-4 w-4" />
          {currentStatus.label}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-20 bg-muted rounded-md flex items-center justify-center shrink-0">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.book_title || 'Unknown Book'}</h3>
                    <p className="text-sm text-muted-foreground">{item.book_author || 'Unknown Author'}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${item.price_at_purchase}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Status History */}
          {order.status_history && order.status_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.status_history.map((event, index) => {
                    const eventStatus = statusConfig[event.status];
                    const EventIcon = eventStatus.icon;
                    const isLast = index === order.status_history!.length - 1;
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
                            {new Date(event.created_at).toLocaleString()}
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

        <div className="space-y-6">
          {/* Order Summary */}
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

          {/* Update Status */}
          {availableTransitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                  }}
                  className="space-y-4"
                >
                  <form.Field name="status">
                    {(field) => (
                      <div className="space-y-2">
                        <Label>New Status</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(v) => field.handleChange(v as OrderStatus)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select new status" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTransitions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusConfig[status].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors[0] && (
                          <p className="text-sm text-destructive">
                            {typeof field.state.meta.errors[0] === 'string'
                              ? field.state.meta.errors[0]
                              : field.state.meta.errors[0].message}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="note">
                    {(field) => (
                      <div className="space-y-2">
                        <Label>Note (optional)</Label>
                        <Textarea
                          placeholder="Add a note about this status change..."
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          rows={3}
                        />
                      </div>
                    )}
                  </form.Field>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!form.getFieldValue('status') || updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Status'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
