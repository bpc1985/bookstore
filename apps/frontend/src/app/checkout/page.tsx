'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const { cart, isLoading: cartLoading, fetchCart, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (user) {
      fetchCart(api);
      setShippingAddress((prev) => ({
        ...prev,
        fullName: user.full_name,
      }));
    }
  }, [user, fetchCart]);

  const formatAddress = () => {
    return `${shippingAddress.fullName}\n${shippingAddress.address}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}\n${shippingAddress.country}`;
  };

  const handleCompleteOrder = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    console.log('Creating order...');
    const address = formatAddress();
    console.log('Shipping address:', address);

    setIsProcessing(true);
    try {
      const order = await api.createOrder(address);
      console.log('Order created:', order);
      setOrderId(order.id);

      await clearCart(api);
      toast.success('Order completed successfully!');
      router.push(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

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
        <p className="text-muted-foreground mb-6">Add some books before checking out.</p>
        <Link href="/books">
          <Button>Browse Books</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Link href="/cart" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Street address, apartment, suite, etc."
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    required
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    required
                    disabled={isProcessing}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                    required
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={shippingAddress.country} disabled />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleCompleteOrder}
                className="w-full"
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
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                cart?.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.book.title}</span>
                      <span className="text-muted-foreground"> x {item.quantity}</span>
                    </div>
                    <span>${(parseFloat(item.book.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${cart?.subtotal || '0.00'}</span>
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
                <span>${cart?.subtotal || '0.00'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}