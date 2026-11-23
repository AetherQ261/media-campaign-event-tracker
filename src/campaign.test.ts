import assert from "node:assert/strict";
import { canDeliver, validateCampaignRequest } from "./media_campaign.js";

assert.equal(canDeliver("processed"), true);
assert.equal(canDeliver("ingested"), false);
assert.throws(() => validateCampaignRequest({ assetId: "a", recipient: "bad" }));
console.log("campaign decision test passed");
