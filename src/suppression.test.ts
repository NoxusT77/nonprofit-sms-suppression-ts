import test from "node:test";
import assert from "node:assert/strict";
import { campaignReport, campaignRequest, eligibleRecipients } from "./suppression.ts";

test("opted-out donors stay out of the receipt and reminder batch", () => {
  const request = campaignRequest.parse({
    campaignId: "spring-2026",
    donorReceipt: "Receipt: thank you for supporting the food pantry.",
    volunteerReminder: "Volunteer shift starts Saturday at 09:00.",
    recipients: [
      { phone: "+15550000001", optedOut: false },
      { phone: "+15550000002", optedOut: true },
      { phone: "+15550000003", optedOut: false },
    ],
  });

  assert.deepEqual(eligibleRecipients(request), ["+15550000001", "+15550000003"]);
  assert.deepEqual(campaignReport(request), { campaignId: "spring-2026", received: 3, suppressed: 1, sent: 2 });
});
