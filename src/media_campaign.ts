import { z } from "zod";
import { infrai } from "./infrai.js";

const campaignRequest = z.object({
  assetId: z.string().min(1),
  assetUrl: z.string().url(),
  recipient: z.string().email(),
  creatorName: z.string().min(1),
});

export type CampaignRequest = z.infer<typeof campaignRequest>;
export type AssetState = "ingested" | "processed" | "delivered";

export function validateCampaignRequest(input: unknown): CampaignRequest {
  return campaignRequest.parse(input);
}

export function canDeliver(state: AssetState): boolean {
  return state === "processed";
}

export async function deliverCreatorBrief(input: unknown) {
  const request = validateCampaignRequest(input);
  const state: AssetState = "processed";
  if (!canDeliver(state)) throw new Error(`Asset ${request.assetId} is not processed`);
  const receipt = await infrai.email.send({
    to: request.recipient,
    subject: `Media brief for ${request.assetId}`,
    body: `Hi ${request.creatorName}, your processed media asset is ready at ${request.assetUrl}.`,
  }, `media-campaign-${request.assetId}`);
  return { assetId: request.assetId, state: "delivered" as const, messageId: receipt.message_id };
}
