import { z } from "zod";

export const campaignRequest = z.object({
  campaignId: z.string().min(1),
  donorReceipt: z.string().min(1),
  volunteerReminder: z.string().min(1),
  recipients: z.array(z.object({
    phone: z.string().min(7),
    optedOut: z.boolean(),
  })).min(1),
});

export type CampaignRequest = z.infer<typeof campaignRequest>;

export function eligibleRecipients(request: CampaignRequest): string[] {
  return request.recipients.filter((recipient) => !recipient.optedOut).map((recipient) => recipient.phone);
}

export function campaignText(request: CampaignRequest): string {
  return `${request.donorReceipt} ${request.volunteerReminder}`;
}

export function campaignReport(request: CampaignRequest) {
  const eligible = eligibleRecipients(request);
  return {
    campaignId: request.campaignId,
    received: request.recipients.length,
    suppressed: request.recipients.length - eligible.length,
    sent: eligible.length,
  };
}
