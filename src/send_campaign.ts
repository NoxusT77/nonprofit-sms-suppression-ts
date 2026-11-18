import { infrai } from "./infrai_sms.ts";
import { campaignReport, campaignText, campaignRequest, eligibleRecipients } from "./suppression.ts";

const input = process.env.CAMPAIGN_JSON;
if (!input) throw new Error("CAMPAIGN_JSON is required");

const request = campaignRequest.parse(JSON.parse(input));
const report = campaignReport(request);
const recipients = eligibleRecipients(request);
if (recipients.length > 0) {
  const result = await infrai.sms.batch.send({ messages: recipients.map((to) => ({ to, body: campaignText(request) })) }, `nonprofit-${request.campaignId}`);
  console.log(JSON.stringify({ report, message_id: result.message_id }));
} else {
  console.log(JSON.stringify({ report, message_id: null }));
}
