'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import StripePayment from '@/components/payment/StripePayment';

interface PayPalButtonProps {
  approvalUrl: string;
  onApprove: () => void;
}

function PayPalButton({ approvalUrl, onApprove }: PayPalButtonProps) {
  const handlePayPalClick = () => {
    window.open(approvalUrl, '_blank');
    onApprove();
  };

  return (
    <Button
      type="button"
      className="w-full bg-[#003087] hover:bg-[#001c4e]"
      size="lg"
      onClick={handlePayPalClick}
    >
      <CreditCard className="h-4 w-4 mr-2" />
      Pay with PayPal
    </Button>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isInitialized } = useAuthStore();
  const { cart, isLoading: cartLoading, fetchCart, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paypal'>('stripe');
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);

  const payerId = searchParams.get('PayerID');
  const paymentIdParam = searchParams.get('paymentId');

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (user) {
      fetchCart();
      setShippingAddress((prev) => ({
        ...prev,
        fullName: user.full_name,
      }));
    }
  }, [user, fetchCart]);

  useEffect(() => {
    if (payerId && paymentIdParam && orderId) {
      handlePayPalReturn(payerId, paymentIdParam);
    }
  }, [payerId, paymentIdParam, orderId]);

  const formatAddress = () => {
    return `${shippingAddress.fullName}\n${shippingAddress.address}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}\n${shippingAddress.country}`;
  };

  const initiateCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      const order = await api.createOrder(formatAddress());
      setOrderId(order.id);

      const payment = await api.initiatePayment(order.id, paymentProvider);

      setPaymentId(payment.payment_id);

      if (payment.client_secret) {
        setClientSecret(payment.client_secret);
      } else if (payment.approval_url) {
        setApprovalUrl(payment.approval_url);
      } else if (payment.status === 'completed') {
        await handlePaymentSuccess(order.id);
      } else {
        toast.info('Payment is being processed...');
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (orderId: number) => {
    await clearCart();
    toast.success('Payment successful! Order placed.');
    router.push(`/order-confirmation/${orderId}`);
  };

  const handlePayPalReturn = async (payerId: string, paypalPaymentId: string) => {
    setIsProcessing(true);
    try {
      if (paymentId) {
        await api.confirmPayPalPayment(paymentId, payerId);
        await handlePaymentSuccess(orderId!);
      }
    } catch (error) {
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
        {/* Shipping & Payment */}
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
                  disabled={!!orderId}
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
                  disabled={!!orderId}
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
                    disabled={!!orderId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    required
                    disabled={!!orderId}
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
                    disabled={!!orderId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={shippingAddress.country} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent>
              {!orderId ? (
                <RadioGroup
                  value={paymentProvider}
                  onValueChange={(value) => setPaymentProvider(value as 'stripe' | 'paypal')}
                >
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="stripe" id="stripe" />
                    <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                      <div className="font-medium">Credit Card (Stripe)</div>
                      <div className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or American Express</div>
                    </Label>
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 mt-3">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                      <div className="font-medium">PayPal</div>
                      <div className="text-sm text-muted-foreground">Pay with your PayPal account</div>
                    </Label>
                    <div className="text-blue-600 font-bold text-sm">PayPal</div>
                  </div>
                </RadioGroup>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Payment method: <span className="font-medium">{paymentProvider === 'stripe' ? 'Credit Card' : 'PayPal'}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          {clientSecret && paymentProvider === 'stripe' && (
            <StripePayment
              clientSecret={clientSecret}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={(error) => toast.error(error.message)}
              amount={cart?.subtotal ? parseFloat(cart.subtotal) : undefined}
            />
          )}

          {approvalUrl && paymentProvider === 'paypal' && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Complete your payment</h3>
                      <p className="text-sm text-muted-foreground">
                        Click the button below to open PayPal and complete your payment. After paying, you will be redirected back to confirm your order.
                      </p>
                    </div>
                  </div>
                  <PayPalButton
                    approvalUrl={approvalUrl}
                    onApprove={() => {
                      toast.info('Please complete the payment in the opened PayPal window');
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {!orderId && !clientSecret && !approvalUrl && (
            <Button
              onClick={initiateCheckout}
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
                  <CreditCard className="h-4 w-4 mr-2" />
                  Continue to Payment
                </>
              )}
            </Button>
          )}
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