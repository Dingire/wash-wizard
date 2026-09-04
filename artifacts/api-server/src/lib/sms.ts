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

type LoyaltyWinSms = {
  recipient: string;
  customerName: string;
  washesCompleted: number;
};
export type SmsStatus = "sent" | "failed" | "not_configured" | "not_requested";

export function normaliseRecipient(phone: string): string | null {
  const recipient = phone.replace(/[^0-9]/g, "");
  return /^\d{7,15}$/.test(recipient) ? recipient : null;
}

async function sendSmsMessage(message: string, recipient: string, logContext: Record<string, unknown>): Promise<SmsStatus> {
  const uid = process.env.ZEDBITE_SMS_UID;
  const apiKey = process.env.ZEDBITE_SMS_API_KEY;
  const senderId = process.env.ZEDBITE_SMS_SENDER_ID;

  if (!uid || !apiKey || !senderId) {
    logger.warn(
      {
        ...logContext,
        hasUid: Boolean(uid),
        hasApiKey: Boolean(apiKey),
        hasSenderId: Boolean(senderId),
      },
      "SMS was requested but Zedbite SMS is not configured",
    );
    return "not_configured";
  }

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
          ...logContext,
          status: response.status,
          providerResponse: providerBody.slice(0, 500),
        },
        "SMS provider rejected message",
      );
      return "failed";
    }
    logger.info(
      {
        ...logContext,
        providerResponse: providerBody.slice(0, 500),
      },
      "SMS sent",
    );
    return "sent";
  } catch (error) {
    logger.warn({ err: error, ...logContext }, "Unable to send SMS");
    return "failed";
  }
}

export async function sendReceiptSms(receipt: ReceiptSms): Promise<SmsStatus> {
  const recipient = normaliseRecipient(receipt.recipient);

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

  return sendSmsMessage(message, recipient, { receiptNumber: receipt.receiptNumber, type: "receipt" });
}

export async function sendLoyaltyWinSms(win: LoyaltyWinSms): Promise<SmsStatus> {
  const recipient = normaliseRecipient(win.recipient);

  if (!recipient) {
    logger.warn({ customerName: win.customerName }, "Loyalty win SMS requested with an invalid recipient number");
    return "failed";
  }

  const message = [
    `Congratulations, ${win.customerName}!`,
    `You have completed ${win.washesCompleted} car washes at U & ME Car Wash.`,
    "You have won a FREE car wash!",
    "Present this SMS at our car wash to claim your free wash.",
  ].join("\n");

  return sendSmsMessage(message, recipient, { customerName: win.customerName, type: "loyalty-win" });
}
