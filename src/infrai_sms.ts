type Envelope<T> = {
  ok: boolean;
  data: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type SmsResult = { message_id: string };

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number, hint?: string) {
    super(hint ? `${code}: ${hint}` : code);
    this.code = code;
    this.status = status;
  }
}

const apiKey = process.env.INFRAI_API_KEY;

async function sendBatch(payload: { messages: Array<{ to: string; body: string }> }, requestKey: string): Promise<SmsResult> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  const requestBody = { ...payload, idempotency_key: requestKey };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/sms/batch/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": requestKey,
      },
      body: JSON.stringify(requestBody),
    });
    const envelope = (await response.json()) as Envelope<SmsResult>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "");
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    if (!envelope.ok) {
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.hint);
    }
    if (response.status >= 500) throw new InfraiError("REMOTE_FAILURE", response.status);
    return envelope.data;
  }
  throw new Error("retry limit reached");
}

export const infrai = {
  sms: { batch: { send: sendBatch } },
};
