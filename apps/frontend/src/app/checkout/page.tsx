"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { api } from "@/lib/api";
import { shippingAddressSchema } from "@/lib/schemas";
import { useCreateOrderMutation } from "@/lib/hooks";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const { cart, isLoading: cartLoading, fetchCart } = useCartStore();
  const createOrderMutation = useCreateOrderMutation();

  const form = useForm({
    defaultValues: {
      fullName: user?.full_name || "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
    },
    validators: {
      onSubmit: shippingAddressSchema,
    },
    onSubmit: async ({ value }) => {
      if (!cart || cart.items.length === 0) {
        toast.error("Your cart is empty");
        return;
      }
      try {
        const order = await createOrderMutation.mutateAsync(value);
        toast.success("Order completed successfully!");
        router.push(`/order-confirmation/${order.id}`);
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
      fetchCart(api);
      form.setFieldValue("fullName", user.full_name);
    }
  }, [user, fetchCart, form]);

  if (!isInitialized || !user) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!cartLoading && (!cart || cart.items.length === 0)) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">
          Add some books before checking out.
        </p>
        <Link href="/books">
          <Button>Browse Books</Button>
        </Link>
      </div>
    );
  }

  const isProcessing = createOrderMutation.isPending;

  return (
    <div className="container py-8">
      <Link
        href="/cart"
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Cart
      </Link>

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Shipping & Complete Order */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
              <CardDescription>Enter your delivery address</CardDescription>
            </CardHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <CardContent className="space-y-4">
                <form.Field name="fullName">
                  {field => (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={field.state.value}
                        onChange={e => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={isProcessing}
                      />
                      {field.state.meta.errors[0] && (
                        <p className="text-sm text-destructive">
                          {typeof field.state.meta.errors[0] === "string"
                            ? field.state.meta.errors[0]
                            : field.state.meta.errors[0].message}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
                <form.Field name="address">
                  {field => (
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        placeholder="Street address, apartment, suite, etc."
                        value={field.state.value}
                        onChange={e => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={isProcessing}
                      />
                      {field.state.meta.errors[0] && (
                        <p className="text-sm text-destructive">
                          {typeof field.state.meta.errors[0] === "string"
                            ? field.state.meta.errors[0]
                            : field.state.meta.errors[0].message}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-4">
                  <form.Field name="city">
                    {field => (
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          disabled={isProcessing}
                        />
                        {field.state.meta.errors[0] && (
                          <p className="text-sm text-destructive">
                            {typeof field.state.meta.errors[0] === "string"
                              ? field.state.meta.errors[0]
                              : field.state.meta.errors[0].message}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="state">
                    {field => (
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          disabled={isProcessing}
                        />
                        {field.state.meta.errors[0] && (
                          <p className="text-sm text-destructive">
                            {typeof field.state.meta.errors[0] === "string"
                              ? field.state.meta.errors[0]
                              : field.state.meta.errors[0].message}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <form.Field name="zipCode">
                    {field => (
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          disabled={isProcessing}
                        />
                        {field.state.meta.errors[0] && (
                          <p className="text-sm text-destructive">
                            {typeof field.state.meta.errors[0] === "string"
                              ? field.state.meta.errors[0]
                              : field.state.meta.errors[0].message}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="country">
                    {field => (
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={field.state.value}
                          disabled
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full mt-5"
                  size="lg"
                  disabled={isProcessing || cartLoading}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Order
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                cart?.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.book.title}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        x {item.quantity}
                      </span>
                    </div>
                    <span>
                      $
                      {(parseFloat(item.book.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${cart?.subtotal || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>$0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${cart?.subtotal || "0.00"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
