'use client';

import { useEffect, useState } from 'react';
import { loadStripe, Stripe, StripeElements, PaymentIntent } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function StripePaymentForm({ clientSecret, onPaymentSuccess, onPaymentError, amount }: {
  clientSecret: string;
  onPaymentSuccess: (paymentId: number) => void;
  onPaymentError: (error: Error) => void;
  amount?: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        throw new Error(submitError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        const paymentId = paymentIntent.metadata?.order_id;
        if (paymentId) {
          onPaymentSuccess(parseInt(paymentId));
        }
      } else if (paymentIntent?.status === 'requires_action') {
        setError('Additional authentication required. Please check your email or banking app.');
      } else if (paymentIntent?.status === 'requires_payment_method') {
        setError('Your payment method was declined. Please try another card.');
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      onPaymentError(new Error(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Card Payment
          </CardTitle>
          <CardDescription>
            {amount ? `Amount: $${amount.toFixed(2)}` : 'Enter your card details below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    name: '',
                  },
                },
              }}
            />
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || !elements || isProcessing}
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${amount ? `$${amount.toFixed(2)}` : 'Now'}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

interface StripePaymentProps {
  clientSecret: string;
  onPaymentSuccess: (paymentId: number) => void;
  onPaymentError: (error: Error) => void;
  amount?: number;
}

export default function StripePayment({ clientSecret, onPaymentSuccess, onPaymentError, amount }: StripePaymentProps) {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  useEffect(() => {
    stripePromise.then(setStripeInstance);
  }, []);

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stripeInstance) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#000000',
        colorBackground: '#ffffff',
        colorText: '#000000',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
  };

  return (
    <Elements stripe={stripeInstance} options={options}>
      <StripePaymentForm
        clientSecret={clientSecret}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        amount={amount}
      />
    </Elements>
  );
}