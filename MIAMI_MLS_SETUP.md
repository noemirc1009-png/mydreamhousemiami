# Miami MLS Setup

MyDreamHouse now uses your Matrix IDX iframe for live MLS search. A deeper custom listing-card integration still requires approved IDX/API access.

## Current IDX Embed

The website embeds:

```html
https://sef.mlsmatrix.com/Matrix/public/IDX.aspx?idx=988b1ef6
```

This is the fastest approved way to show listings from your MLS account because Matrix hosts the searchable MLS experience inside the iframe.

## What to Request

Ask MIAMI REALTORS for IDX / RESO Web API access through Bridge API.

The usual flow is:

1. Log in to the Miami Gateway with your MLS credentials.
2. Open the Bridge Agreement Management Dashboard.
3. Create or approve an IDX agreement.
4. Get the Bridge API feed credentials/API token.
5. Put those credentials in `.env` on the server, not directly in public website code.

## Why a Backend Is Needed

MLS API credentials should not be placed in `assets/config.js` for a public website because anyone can view browser JavaScript.

The production flow is:

```text
MyDreamHouse website -> server.js private backend -> Bridge API / MIAMI MLS
```

The backend can safely store the API token, call the MLS feed, cache responses, and return only approved public IDX fields to the website.

## Local Backend Setup

1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`.
3. Fill in your approved MLS feed values.
4. Run `npm start`.
5. Open `http://localhost:3000`.

The website calls `/api/listings`; the MLS token stays inside `.env`.

## Current Website Files

- `assets/config.js` identifies the planned provider.
- `assets/app.js` already has a normalizer for RESO-style listing fields.
- `assets/listings.js` is demo data until the live feed is approved.

## Credentials Needed Later

Do not commit or paste passwords into website files.

For the backend connection, we will need:

- Bridge API endpoint/base URL
- API token/client credentials
- Feed type: IDX, VOW, office listings, or agent listings
- Broker/agent display rules required by MIAMI MLS
- Required disclaimer text and update-frequency rules
