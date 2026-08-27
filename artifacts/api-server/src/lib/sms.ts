import { logger } from "./logger";

const SMS_ENDPOINT = "https://bulksms.zedbite.com/api/send-message";

type ReceiptSms = {
  recipient: string;
  customerName: string;
  receiptNumber: string;
  serviceName: string;
  vehiclePlate: string;
  amountPaid: string;
};
export type SmsStatus = "sent" | "failed" | "not_configured" | "not_requested";

export function normaliseRecipient(phone: string): string | null {
  const recipient = phone.replace(/[^0-9]/g, "");
  return /^\d{7,15}$/.test(recipient) ? recipient : null;
}

export async function sendReceiptSms(receipt: ReceiptSms): Promise<SmsStatus> {
  const uid = process.env.ZEDBITE_SMS_UID;
  const apiKey = process.env.ZEDBITE_SMS_API_KEY;
  const senderId = process.env.ZEDBITE_SMS_SENDER_ID;
  const recipient = normaliseRecipient(receipt.recipient);

  if (!uid || !apiKey || !senderId) {
    logger.warn(
      {
        receiptNumber: receipt.receiptNumber,
        hasUid: Boolean(uid),
        hasApiKey: Boolean(apiKey),
        hasSenderId: Boolean(senderId),
      },
      "SMS was requested but Zedbite SMS is not configured",
    );
    return "not_configured";
  }
  if (!recipient) {
    logger.warn({ receiptNumber: receipt.receiptNumber }, "SMS was requested with an invalid recipient number");
    return "failed";
  }

  const message = [
    `Thank you, ${receipt.customerName}!`,
    `Receipt: ${receipt.receiptNumber}`,
    `Service: ${receipt.serviceName}`,
    `Vehicle: ${receipt.vehiclePlate}`,
    `Amount paid: K${Number(receipt.amountPaid).toFixed(2)}`,
  ].join("\n");

  try {
    const response = await fetch(SMS_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ uid, api_key: apiKey, sender_id: senderId, recipient, message }),
      signal: AbortSignal.timeout(10_000),
    });

    const providerBody = await response.text();
    if (!response.ok) {
      logger.warn(
        {
          receiptNumber: receipt.receiptNumber,
          status: response.status,
          providerResponse: providerBody.slice(0, 500),
        },
        "SMS provider rejected receipt message",
      );
      return "failed";
    }
    logger.info(
      {
        receiptNumber: receipt.receiptNumber,
        providerResponse: providerBody.slice(0, 500),
      },
      "SMS receipt sent",
    );
    return "sent";
  } catch (error) {
    logger.warn({ err: error, receiptNumber: receipt.receiptNumber }, "Unable to send SMS receipt");
    return "failed";
  }
}
