'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

type PaymentStatus = 'pending' | 'processing' | 'requires_action' | 'completed' | 'failed' | 'refunded';

interface PaymentStatusDisplayProps {
  paymentId: number;
  onComplete?: () => void;
  onFailed?: () => void;
  pollingInterval?: number;
}

export default function PaymentStatusDisplay({
  paymentId,
  onComplete,
  onFailed,
  pollingInterval = 2000,
}: PaymentStatusDisplayProps) {
  const [status, setStatus] = useState<PaymentStatus>('processing');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentStatus = async () => {
    try {
      const payment = await api.getPayment(paymentId);
      setStatus(payment.status as PaymentStatus);

      if (payment.status === 'completed' && onComplete) {
        onComplete();
      } else if (payment.status === 'failed' && onFailed) {
        onFailed();
      }
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentStatus();

    const interval = setInterval(() => {
      if (status !== 'completed' && status !== 'failed' && status !== 'refunded') {
        fetchPaymentStatus();
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [paymentId, pollingInterval, status]);

  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-blue-600" />,
          title: 'Payment Pending',
          description: 'Your payment is being processed.',
          bgClass: 'bg-blue-50 dark:bg-blue-950',
          textClass: 'text-blue-600',
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-blue-600" />,
          title: 'Processing Payment',
          description: 'Please wait while we process your payment.',
          bgClass: 'bg-blue-50 dark:bg-blue-950',
          textClass: 'text-blue-600',
        };
      case 'requires_action':
        return {
          icon: <AlertCircle className="h-8 w-8 text-yellow-600" />,
          title: 'Additional Action Required',
          description: 'Please complete the required authentication steps.',
          bgClass: 'bg-yellow-50 dark:bg-yellow-950',
          textClass: 'text-yellow-600',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
          title: 'Payment Successful',
          description: 'Your payment has been completed successfully.',
          bgClass: 'bg-green-50 dark:bg-green-950',
          textClass: 'text-green-600',
        };
      case 'failed':
        return {
          icon: <XCircle className="h-8 w-8 text-red-600" />,
          title: 'Payment Failed',
          description: 'Your payment could not be processed. Please try again.',
          bgClass: 'bg-red-50 dark:bg-red-950',
          textClass: 'text-red-600',
        };
      case 'refunded':
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-purple-600" />,
          title: 'Payment Refunded',
          description: 'Your payment has been refunded.',
          bgClass: 'bg-purple-50 dark:bg-purple-950',
          textClass: 'text-purple-600',
        };
      default:
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin text-gray-600" />,
          title: 'Unknown Status',
          description: 'Payment status is unknown.',
          bgClass: 'bg-gray-50 dark:bg-gray-950',
          textClass: 'text-gray-600',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={statusInfo.bgClass}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={statusInfo.textClass}>{statusInfo.icon}</div>
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${statusInfo.textClass}`}>
              {statusInfo.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {statusInfo.description}
            </p>
          </div>
          {isLoading && status !== 'completed' && status !== 'failed' && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}