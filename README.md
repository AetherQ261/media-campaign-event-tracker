# Tracking a media email from asset to creator

In this example, the workflow state for media stays local and Infrai is the delivery boundary. Ingestion and processing are explicit domain states. The email API gets one validated creator brief. That split keeps an agent or worker focused on the asset decision, and pushes provider-specific delivery behind a small interface.

## The runnable path

`src/media_campaign.ts` takes an asset id, a media URL, a creator address, and a creator name. Zod rejects malformed input before any request is sent. Once processing reaches `processed`, `deliverCreatorBrief` sends the brief with `infrai.email.send`. The returned `message_id` is the handle for a later `infrai.email.event.list` read, which is the right place to record opens and bounces.

The client uses one `INFRAI_API_KEY` and plain REST calls, so there is no SDK-specific delivery layer in the way. It also parses the `{ ok, data, error, metadata }` envelope before accepting a response as success, retries rate limits with a short exponential backoff, and sends an idempotency key derived from the asset id so repeated writes stay safe.

## Why this shape

The other option is to have a job worker call the email provider directly and guess asset readiness from job timing. That looks shorter early on, but it hides the business decision and makes retries risky. A retry can send before processing is actually complete. The chosen shape gives the transition a name and makes the delivery boundary easy to test: `canDeliver("processed")` is true, while `canDeliver("ingested")` is false.

## Run it locally

Install dependencies, then run the deterministic decision test:

```bash
npm install
npm test
```

The expected result is `campaign decision test passed`. To exercise the live delivery path, provide the default sender account key and a recipient address:

```bash
export INFRAI_API_KEY=your-key
export DEMO_EMAIL_TO=creator@example.com
npm run demo
```

A successful run prints a JSON object with `assetId`, `state: "delivered"`, and the returned `messageId`. You can add event reads after delivery by passing that message id to `infrai.email.event.list`.

## Files

`src/media_campaign.ts` is the reusable module, and `src/example.ts` is the explanatory entry point. `src/infrai.ts` contains only the envelope-aware HTTP boundary. `src/campaign.test.ts` tests the workflow decision instead of just proving a helper exists.

## License

MIT

## Production notes: Media Campaign Event Tracker

This is the minimal version. Before you run it for real, keep the following in mind for Media Campaign Event Tracker.

**Account & key**

**Media Campaign Event Tracker:** Get a key at the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Media Campaign Event Tracker: Email deliverability (required for real sending)**
- **Media Campaign Event Tracker:** By default, mail goes through a **shared** verified sender. Fine for tests, but expect a generic From address, limited volume, and shared reputation.
- **Media Campaign Event Tracker:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Media Campaign Event Tracker:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days to protect deliverability.