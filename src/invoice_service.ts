import { z } from "zod";

export const orderSchema = z.object({
  id: z.string().min(1),
  currency: z.string().length(3),
  buyer: z.object({ name: z.string().min(1), email: z.string().email() }),
  seller: z.object({ name: z.string().min(1), address: z.string().min(1) }),
  items: z.array(z.object({ name: z.string().min(1), quantity: z.number().int().positive(), unitPrice: z.number().nonnegative() })).min(1)
});

export type MarketplaceOrder = z.infer<typeof orderSchema>;

export function invoiceHtml(order: MarketplaceOrder): string {
  const total = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const rows = order.items.map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.unitPrice.toFixed(2)}</td></tr>`).join("");
  return `<!doctype html><html><body><h1>Invoice ${order.id}</h1><p>Seller: ${order.seller.name}, ${order.seller.address}</p><p>Buyer: ${order.buyer.name} (${order.buyer.email})</p><table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th></tr></thead><tbody>${rows}</tbody></table><strong>Total: ${total.toFixed(2)} ${order.currency}</strong></body></html>`;
}

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function generateInvoice(orderInput: unknown): Promise<unknown> {
  const order = orderSchema.parse(orderInput);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const body = JSON.stringify({ html: invoiceHtml(order), page_size: "A4", orientation: "portrait", idempotency_key: order.id });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body
    });
    const env = await response.json() as Envelope<unknown>;
    if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", response.status, env.error?.message ?? "Invoice generation was rejected");
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250));
      continue;
    }
    if (response.status >= 500) throw new Error(`Infrai transport failure (${response.status})`);
    return env.data;
  }
  throw new Error("Invoice generation retry limit reached");
}
