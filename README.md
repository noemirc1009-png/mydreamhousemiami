# MyDreamHouse

A real estate website with a live Matrix IDX search, featured listing cards, favorites, lead capture, and an MLS API integration point for future custom data feeds.

## Run

The static site can still be opened with `index.html`, but live MLS data needs the private backend:

```bash
copy .env.example .env
npm start
```

Then open `http://localhost:3000`.

## Host Online

This project can be hosted as a Node web service because `server.js` serves both the website and backend routes.

Recommended simple option: Render.

1. Create a GitHub repository for this folder.
2. Push the project to GitHub.
3. In Render, create a new `Web Service` from that repository.
4. Use:

```text
Build command: leave empty
Start command: npm start
```

5. Add environment variables from `.env.example`.
6. Deploy and share the Render URL with clients.

The included `render.yaml` can also be used as a Render blueprint.

## Matrix IDX Feed

The live MLS search is embedded from your Matrix IDX account:

```html
https://sef.mlsmatrix.com/Matrix/public/IDX.aspx?idx=988b1ef6
```

That iframe is the active MLS feed on the first tab of the site.

The page refreshes the Matrix IDX frame every hour while it is open, so visitors get a fresh pull from the MLS without reloading the whole website.

## MLS API Feed

The browser calls `/api/listings`. `server.js` calls your MLS provider from the private backend, caches the response for one hour by default, and returns IDX-safe listing data to the website. If the feed is not configured or unavailable, the site falls back to sample listings from `assets/listings.js`.

This project is set up for MIAMI REALTORS / Bridge API. See `MIAMI_MLS_SETUP.md`.

When your MLS provider gives you API/feed access, copy `.env.example` to `.env` and fill in:

```text
MLS_BASE_URL="https://api.bridgedataoutput.com/api/v2/OData/your-dataset-id"
MLS_LISTINGS_PATH="/Property"
MLS_TOKEN="your-private-token"
```

For production, MLS credentials should live on a private backend, not inside browser JavaScript. The website should call your backend, and your backend should call the MLS.

## Search Alerts

Clients can create saved search alerts from the `Search Alerts` tab. The backend saves alert requests to `data/search-alerts.json`.

To forward new alert requests into an email or CRM automation, set:

```text
EMAIL_WEBHOOK_URL="https://your-email-or-crm-webhook"
```

The current Matrix iframe cannot expose individual listing matches to this website. Fully automatic matched-listing emails require either Matrix/MLS client portal alerts or a RESO/IDX API feed connected to the backend.

## Files

- `index.html` - website UI
- `assets/styles.css` - visual design
- `assets/app.js` - search, favorites, MLS loading, lead form
- `assets/listings.js` - sample listing data
- `assets/config.js` - feed configuration
- `server.js` - private MLS proxy and static file server
- `.env.example` - required MLS settings template
