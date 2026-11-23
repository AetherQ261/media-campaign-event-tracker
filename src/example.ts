import { deliverCreatorBrief } from "./media_campaign.js";

const recipient = process.env.DEMO_EMAIL_TO;
if (!recipient) throw new Error("DEMO_EMAIL_TO is required");

const result = await deliverCreatorBrief({
  assetId: "launch-trailer-01",
  assetUrl: "https://media.example.test/launch-trailer-01.mp4",
  recipient,
  creatorName: "Mina",
});
console.log(JSON.stringify(result, null, 2));
