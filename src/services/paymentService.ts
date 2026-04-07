/**
 * Razorpay Payment Service
 * Handles payment processing for online payments
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentOptions {
  amount: number; // in INR
  currency?: string;
  name: string;
  description: string;
  orderId?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

/**
 * Load Razorpay script dynamically
 */
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Initialize Razorpay payment
 */
export const initiatePayment = async (
  options: PaymentOptions,
  taskId: string
): Promise<PaymentResult> => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      return {
        success: false,
        error: 'Failed to load Razorpay SDK',
      };
    }

    // Create order via Edge Function
    const orderData = await createPaymentOrder(options.amount, taskId);
    if (!orderData) {
      return {
        success: false,
        error: 'Failed to create payment order',
      };
    }

    // Create payment promise
    return new Promise((resolve) => {
      const razorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount, // Already in paise from backend
        currency: orderData.currency,
        name: options.name,
        description: options.description,
        order_id: orderData.orderId,
        prefill: options.prefill,
        notes: options.notes,
        theme: {
          color: options.theme?.color || '#3A8B24',
        },
        handler: async function (response: any) {
          // Verify payment on backend
          const verified = await verifyPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
            taskId
          );

          if (verified) {
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
          } else {
            resolve({
              success: false,
              error: 'Payment verification failed',
            });
          }
        },
        modal: {
          ondismiss: function () {
            resolve({
              success: false,
              error: 'Payment cancelled by user',
            });
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    });
  } catch (error) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    };
  }
};

/**
 * Create Razorpay order via Edge Function
 */
export const createPaymentOrder = async (
  amount: number,
  taskId: string
): Promise<{ orderId: string; amount: number; currency: string } | null> => {
  try {
    const { supabase } = await import('@/db/supabase');
    
    const { data, error } = await supabase.functions.invoke('razorpay-payment?action=create-order', {
      body: { amount, taskId, currency: 'INR' },
      method: 'POST',
    });

    if (error) {
      const errorMsg = await error?.context?.text?.();
      console.error('Error creating payment order:', errorMsg || error.message);
      throw new Error(errorMsg || error.message);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to create payment order');
    }

    return {
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
    };
  } catch (error) {
    console.error('Error creating payment order:', error);
    return null;
  }
};

/**
 * Verify payment signature via Edge Function
 */
export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string,
  taskId: string
): Promise<boolean> => {
  try {
    const { supabase } = await import('@/db/supabase');
    
    const { data, error } = await supabase.functions.invoke('razorpay-payment?action=verify-payment', {
      body: {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        taskId,
      },
      method: 'POST',
    });

    if (error) {
      const errorMsg = await error?.context?.text?.();
      console.error('Error verifying payment:', errorMsg || error.message);
      return false;
    }

    return data?.success === true;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
};

/**
 * Generate payment QR code data for UPI
 */
export const generateUPIQRData = (
  amount: number,
  upiId: string,
  name: string,
  note?: string
): string => {
  const params = new URLSearchParams({
    pa: upiId, // Payee address (UPI ID)
    pn: name, // Payee name
    am: amount.toString(), // Amount
    cu: 'INR', // Currency
    tn: note || 'Payment for task', // Transaction note
  });

  return `upi://pay?${params.toString()}`;
};
