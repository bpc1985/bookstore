'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronRight } from 'lucide-react';
import { Button } from '@bookstore/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@bookstore/ui';
import { Badge } from '@bookstore/ui';
import { Skeleton } from '@bookstore/ui';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { OrderListItem, PaginatedResponse } from '@/types';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' as const, color: 'text-yellow-600' },
  paid: { label: 'Paid', icon: CheckCircle, variant: 'default' as const, color: 'text-blue-600' },
  shipped: { label: 'Shipped', icon: Truck, variant: 'default' as const, color: 'text-purple-600' },
  completed: { label: 'Completed', icon: CheckCircle, variant: 'default' as const, color: 'text-green-600' },
  cancelled: { label: 'Cancelled', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [orders, setOrders] = useState<PaginatedResponse<OrderListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      setIsLoading(true);
      try {
        const data = await api.getOrders({ page });
        setOrders(data);
      } catch (error) {
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, [user, page]);

  if (!isInitialized || !user) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
       ) : !orders || !orders.items || orders.items.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">Start shopping to see your orders here.</p>
          <Link href="/books">
            <Button>Browse Books</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.items.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">Order #{order.id}</span>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className={`h-3 w-3 ${status.color}`} />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm">
                            {order.item_count} item{order.item_count > 1 ? 's' : ''} &bull; ${order.total_amount}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {orders.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {orders.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(orders.pages, p + 1))}
                disabled={page === orders.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
