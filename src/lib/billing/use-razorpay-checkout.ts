// --- Yahan Types ko define kar rahe hain taaki error na aaye ---
type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

// --- Function ka Sahi Definition ---
function buildRazorpayOptions(
  session: any, // 'any' isliye taaki session structure se conflict na ho
  onSuccess: () => void,
  onDismiss: () => void,
  onError: (message: string) => void
): Record<string, any> {
  
  const base: Record<string, any> = {
    key: session.keyId,
    name: session.name,
    description: session.description,
    prefill: session.prefill,
    notes: session.notes,
    theme: { color: "#deff9a" },
    modal: {
      ondismiss: onDismiss,
    },
    handler: async (response: RazorpayHandlerResponse) => {
      try {
        const verifyRes = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.ok) {
          throw new Error(verifyData.error ?? "Payment verification failed.");
        }
        onSuccess();
      } catch (err: any) {
        onError(err.message ?? "Payment verification failed.");
      }
    },
  };

  return {
    ...base,
    order_id: session.orderId,
    amount: 189900,
    currency: "INR",
  };
}