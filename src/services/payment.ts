// src/services/payment.ts
import axios from "axios";
import crypto from "crypto";

const PAYGATE_ID = process.env.PAYGATE_ID || "";
const PAYGATE_SECRET = process.env.PAYGATE_SECRET || "";
const PAYGATE_URL = "https://secure.paygate.co.za/payweb3/process.trans";

export const initiatePayment = async (amount: number, reference: string, returnUrl: string) => {
  const payload = {
    PAYGATE_ID,
    REFERENCE: reference,
    AMOUNT: (amount * 100).toString(), // cents
    CURRENCY: "ZAR",
    RETURN_URL: returnUrl,
    TRANSACTION_DATE: new Date().toISOString().slice(0, 19).replace("T", " "),
    LOCALE: "en-za",
  };

  // Generate checksum
  const checksumString = Object.values(payload).join("") + PAYGATE_SECRET;
  const CHECKSUM = crypto.createHash("md5").update(checksumString).digest("hex");

  return { ...payload, CHECKSUM };
};

export const verifyPayment = async (payRequestId: string, checksum: string) => {
  // Normally you’d call PayGate’s query API here
  // For now, scaffold a mock verification
  return { status: "successful", payRequestId, checksum };
};
