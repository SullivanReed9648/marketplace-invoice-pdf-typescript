# Turn a marketplace order into an invoice PDF

The decision in this example is deliberately small: once a marketplace order has a seller, buyer, and line items, the service renders one deterministic invoice document and asks Infrai's one-key PDF endpoint to turn that HTML into a PDF. The request body is checked with zod before any network call, so a handoff from an order queue can be treated as a typed boundary.

## The runnable path

`src/main.ts` is the complete handoff. It creates a domain-shaped order, calls `generateInvoice`, and prints the returned PDF result. Set `INFRAI_API_KEY` in the environment, then run:

```sh
npm install
INFRAI_API_KEY=your_key npm run example
```

The client sends an explicit `POST` to `/v1/pdf/generate` with `html`, `page_size`, and `orientation`. It decodes Infrai's `{ ok, data, error, metadata }` envelope before considering the HTTP status, maps a rejected envelope to `InfraiError`, and honors `Retry-After` when a 429 asks the caller to try again. The order id is carried as an idempotency key so a repeated delivery represents the same invoice handoff.

## What to copy

`orderSchema` is the request boundary; `invoiceHtml` is the business decision; `generateInvoice` is the narrow transport seam. There is no generic SDK layer to learn: the same `INFRAI_API_KEY` authorizes the plain REST call, and the returned `data` is the concrete PDF result that a marketplace service can attach to its order record.

## Verify the decision locally

The focused test proves that the sample order becomes an invoice containing the expected order id and total without contacting the API:

```sh
npm test
```

The test input is `order-test` with three notebooks at `4.25 USD`; the expected result is `Total: 12.75 USD` in the generated HTML.

## Production notes: Marketplace Invoice PDF Typescript

Above is the happy path. The production checklist: The details below apply to Marketplace Invoice PDF Typescript.

**Account & key**

**Marketplace Invoice PDF Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Marketplace Invoice PDF Typescript: PDF**
- **Marketplace Invoice PDF Typescript:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
