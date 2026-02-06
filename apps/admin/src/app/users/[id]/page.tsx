"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Shield, Check, Ban, Mail, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import type { User, OrderListItem as BaseOrderListItem } from "@bookstore/types";

interface OrderListItem extends BaseOrderListItem {
  user_id?: number;
}
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const userData = await api.getUser(parseInt(id));
        setUser(userData);

        // Load user orders
        const ordersData = await api.getAdminOrders({
          page: 1,
          size: 10,
        });
        const items = ordersData.items as OrderListItem[];
        setOrders(items.filter(o => o.user_id === parseInt(id)));
      } catch {
        toast.error("Failed to load user data");
        router.push("/users");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleUpdateRole = async () => {
    if (!user || !newRole) return;

    api.updateUserRole(user.id, newRole)
      .then(() => {
        toast.success(`User role updated to ${newRole}`);
        setRoleDialogOpen(false);
        setUser({ ...user, role: newRole as User["role"] });
      })
      .catch(() => {
        toast.error("Failed to update user role");
      });
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    const isActive = user.is_active;
    const action = isActive ?
      api.deactivateUser(user.id) :
      api.activateUser(user.id);

    action
      .then(() => {
        toast.success(isActive ? "User deactivated" : "User activated");
        setStatusDialogOpen(false);
        setUser({ ...user, is_active: !isActive });
      })
      .catch(() => {
        toast.error("Failed to update user status");
      });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card><CardContent className="p-6 space-y-4">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </CardContent></Card>
          <Card><CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-full" />
          </CardContent></Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-4">User not found</p>
        <Link href="/users">
          <Button>Back to Users</Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = user.id === currentUser?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.full_name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        {!isCurrentUser && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewRole(user.role === "admin" ? "user" : "admin");
                setRoleDialogOpen(true);
              }}
            >
              <Shield className="mr-2 h-4 w-4" />
              {user.role === "admin" ? "Remove Admin" : "Make Admin"}
            </Button>
            <Button
              variant={user.is_active ? "destructive" : "default"}
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
            >
              {user.is_active ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* User Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</p>
              <p className="mt-0.5 font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Email
              </p>
              <p className="mt-0.5 font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full Name</p>
              <p className="mt-0.5 font-medium">{user.full_name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                Role
              </p>
              <Badge variant={user.role === "admin" ? "default" : "secondary"} className="mt-1 gap-1 font-normal">
                <Shield className="h-3 w-3" />
                {user.role}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
              <Badge
                variant="secondary"
                className={`mt-1 font-normal ${
                  user.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Created
              </p>
              <p className="mt-0.5 font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Last Updated
              </p>
              <p className="mt-0.5 font-medium">{new Date(user.updated_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Orders</p>
              <p className="mt-1 text-3xl font-bold">{orders.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Spent</p>
              <p className="mt-1 text-3xl font-bold">
                ${orders.reduce((sum, order) => sum + parseFloat(String(order.total_amount)), 0).toFixed(2)}
              </p>
            </div>
            <Link href={`/orders?user=${user.email}`}>
              <Button variant="outline" className="w-full mt-2">
                View All Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Update Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change role for {user.full_name} ({user.email})?
              Current role: <Badge className="ml-1">{user.role}</Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={!newRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.is_active ? "Deactivate User" : "Activate User"}
            </DialogTitle>
            <DialogDescription>
              {user.is_active ? (
                <>
                  Deactivate {user.full_name}? They will not be able to log in.
                </>
              ) : (
                <>
                  Activate {user.full_name}? They will be able to log in again.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={user.is_active ? "destructive" : "default"}
              onClick={handleToggleStatus}
            >
              {user.is_active ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
