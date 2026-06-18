export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initializePayment = async (keyId: string) => {
  const res = await loadRazorpayScript();

  if (!res) {
    alert("Razorpay SDK failed to load. Are you online?");
    return;
  }

  try {
    // 1. Apne naye backend API route ko call karo
    const response = await fetch("/api/checkout", { method: "POST" });
    const data = await response.json();

    if (!data.success) {
      alert("Backend order creation failed: " + data.error);
      return;
    }

    // 2. Razorpay checkout modal ke options setup karo
    const options = {
      key: keyId, // Aapki env se pass hone wali Live Key ID
      amount: data.amount,
      currency: data.currency, // $ USD
      name: "AI Scout X",
      description: "Pro Plan - 30 Days Premium Access",
      order_id: data.orderId, // Jo backend se generate hua hai
      handler: async function (response: any) {
        // Success Handler
        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
        window.location.href = "/dashboard/discover?billing=success";
      },
      prefill: {
        name: "", // Optional: User metadata if available
        email: "",
      },
      theme: {
        color: "#000000", // Premium aesthetic ultra-black look
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  } catch (err) {
    console.error("Payment initialization failed", err);
    alert("Something went wrong while initiating the checkout.");
  }
};