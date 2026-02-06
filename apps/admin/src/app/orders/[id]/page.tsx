"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Order as BaseOrder } from "@bookstore/types";

interface StatusHistoryEntry {
  id?: number;
  new_status?: string;
  status?: string;
  timestamp?: string;
  created_at?: string;
  note?: string | null;
}

interface Order extends Omit<BaseOrder, 'status_history'> {
  user_email?: string;
  status_history?: StatusHistoryEntry[];
}
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  paid: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  shipped: "bg-violet-100 text-violet-700 hover:bg-violet-100",
  completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function loadOrder() {
      setIsLoading(true);
      try {
        const data = await api.getAdminOrder(parseInt(id)) as Order;
        setOrder(data);
        setStatus(data.status);
      } catch {
        toast.error("Failed to load order");
        router.push("/orders");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order || !status) return;

    setIsUpdating(true);
    try {
      const updated = await api.updateOrderStatus(order.id, status, note || undefined) as Order;
      setOrder(updated);
      toast.success(`Order status updated to ${status}`);
      setNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const updated = await api.updateOrderStatus(order.id, "cancelled", "Cancelled by admin") as Order;
      setOrder(updated);
      setStatus("cancelled");
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card><CardContent className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </CardContent></Card>
          <Card><CardContent className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent></Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Link href="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const availableStatuses = STATUS_TRANSITIONS[order.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Order #{order.id}</h1>
          <Badge variant="secondary" className={`font-normal capitalize ${STATUS_STYLES[order.status] || ""}`}>
            {order.status}
          </Badge>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "User", value: order.user_email || "N/A" },
              { label: "Payment Reference", value: order.payment_reference || "N/A" },
              { label: "Shipping Address", value: order.shipping_address },
              { label: "Created", value: new Date(order.created_at).toLocaleString() },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 font-medium">{item.value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Amount</p>
              <p className="mt-0.5 text-2xl font-bold">${parseFloat(String(order.total_amount)).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status Update */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select
                value={status}
                onValueChange={setStatus}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.length > 0 ? (
                    availableStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={order.status} disabled>
                      {order.status} (current)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this status change..."
                disabled={isUpdating}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdating || !status || status === order.status}
              >
                {isUpdating ? "Updating..." : "Update Status"}
              </Button>
              {order.status !== "cancelled" && order.status !== "completed" && (
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  disabled={isUpdating}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              )}
            </div>

            {order.status === "completed" && (
              <p className="text-sm text-muted-foreground">
                This order is complete and cannot be changed.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {order.items && order.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Book Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{item.book_title}</TableCell>
                    <TableCell className="text-muted-foreground">{item.book_author}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${parseFloat(String(item.price_at_purchase)).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      ${(parseFloat(String(item.price_at_purchase)) * item.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No items found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status History */}
      {order.status_history && order.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.status_history.map((entry, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`font-normal capitalize ${STATUS_STYLES[entry.new_status || entry.status || ""] || ""}`}>
                        {entry.new_status || entry.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp || entry.created_at || "").toLocaleString()}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-sm mt-1 text-muted-foreground">
                        {entry.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
