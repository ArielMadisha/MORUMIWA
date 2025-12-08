// src/services/payment.ts
import axios from "axios";
import crypto from "crypto";

const PAYGATE_ID = process.env.PAYGATE_ID || "";
const PAYGATE_SECRET = process.env.PAYGATE_SECRET || "";
const PAYGATE_URL = process.env.PAYGATE_URL || "https://secure.paygate.co.za/payweb3/process.trans";

/**
 * Initiate a payment request
 */
export const initiatePayment = async (amount: number, reference: string, returnUrl: string) => {
  if (!amount || amount <= 0) throw new Error("Invalid payment amount");
  if (!reference) throw new Error("Payment reference is required");

  const payload = {
    PAYGATE_ID,
    REFERENCE: reference,
    AMOUNT: (amount * 100).toString(), // cents
    CURRENCY: "ZAR",
    RETURN_URL: returnUrl,
    TRANSACTION_DATE: new Date().toISOString().slice(0, 19).replace("T", " "),
    LOCALE: "en-za",
  };

  const checksumString = Object.values(payload).join("") + PAYGATE_SECRET;
  const CHECKSUM = crypto.createHash("md5").update(checksumString).digest("hex");

  return { ...payload, CHECKSUM, PAYGATE_URL };
};

/**
 * Verify a payment request
 */
export const verifyPayment = async (payRequestId: string, checksum: string) => {
  try {
    // Normally you’d call PayGate’s query API here
    // For now, scaffold a mock verification
    return {
      success: true,
      status: "successful",
      payRequestId,
      checksum,
      verifiedAt: new Date(),
    };
  } catch (err) {
    return {
      success: false,
      status: "failed",
      error: "Verification error",
    };
  }
};
