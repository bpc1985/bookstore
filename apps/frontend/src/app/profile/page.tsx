"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Calendar, Package, Star, ShieldCheck } from "lucide-react";
import { useForm } from '@tanstack/react-form';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { profileUpdateSchema } from '@/lib/schemas';
import { useUpdateProfileMutation } from '@/lib/hooks';
import { toast } from "sonner";
import type { OrderListItem } from "@bookstore/types";
import AuthGuard from "@/components/middleware/AuthGuard";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [recentOrders, setRecentOrders] = useState<OrderListItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const updateProfileMutation = useUpdateProfileMutation();

  const form = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
    },
    validators: {
      onSubmit: profileUpdateSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProfileMutation.mutateAsync(value);
        toast.success("Profile updated successfully");
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
  });

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (user) {
      form.setFieldValue('full_name', user.full_name);
      fetchRecentOrders();
    }
  }, [user, form]);

  async function fetchRecentOrders() {
    setIsLoadingOrders(true);
    try {
      const data = await api.getOrders({ page: 1, size: 5 });
      setRecentOrders(data.items);
    } catch (error) {
      console.error("Failed to load orders");
    } finally {
      setIsLoadingOrders(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <AuthGuard>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">{user.full_name}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="mt-2"
                  >
                    {user.role === "admin" && (
                      <ShieldCheck className="h-3 w-3 mr-1" />
                    )}
                    {user.role === "admin" ? "Administrator" : "Customer"}
                  </Badge>
                </div>
                <Separator className="my-6" />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Member since{" "}
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{recentOrders.length} recent orders</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span>0 reviews</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="settings">
              <TabsList className="mb-6">
                <TabsTrigger value="settings">Account Settings</TabsTrigger>
                <TabsTrigger value="orders">Recent Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                      }}
                      className="space-y-4"
                    >
                      <form.Field name="full_name">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                              id="full_name"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={field.handleBlur}
                            />
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
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user.email}
                          disabled
                          placeholder="you@example.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </div>
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>
                          Your most recent purchases
                        </CardDescription>
                      </div>
                      <Link href="/orders">
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingOrders ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : recentOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No orders yet</p>
                        <Link href="/books">
                          <Button variant="link">Start Shopping</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentOrders.map(order => (
                          <Link key={order.id} href={`/orders/${order.id}`}>
                            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div>
                                <p className="font-medium">Order #{order.id}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(
                                    order.created_at,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ${order.total_amount}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
