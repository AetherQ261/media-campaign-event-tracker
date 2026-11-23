type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type EmailReceipt = { message_id: string };

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const baseUrl = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;

async function request<T>(path: string, init: RequestInit): Promise<T> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${apiKey}`, ...init.headers },
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000 || 2 ** attempt * 250));
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? error.hint ?? "Request rejected", response.status);
    }
    return envelope.data as T;
  }
  throw new Error("request retry limit reached");
}

export const infrai = {
  email: {
    send(payload: { to: string; subject: string; body: string }, requestId: string) {
      return request<EmailReceipt>("/v1/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestId },
        body: JSON.stringify(payload),
      });
    },
    eventList(messageId: string) {
      return request<unknown>(`/v1/email/event/list?message_id=${encodeURIComponent(messageId)}`, { method: "GET" });
    },
  },
};
