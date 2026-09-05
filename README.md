# n8n-nodes-asterwise

An [n8n](https://n8n.io) community node for the [Asterwise](https://asterwise.com) astrology API. Vedic and Western natal charts, kundali matching with Rajju and Vedha reported as vetoes, daily panchanga, numerology, and a raw-request operation for any of the 118 endpoints. Usable as a tool by n8n AI agents.

## Install

In n8n: Settings, Community nodes, Install, package name `n8n-nodes-asterwise`. Or, for a self-hosted instance:

```bash
npm install n8n-nodes-asterwise
```

Then create an **Asterwise API** credential with a key from [asterwise.com/dashboard](https://asterwise.com/dashboard). The free tier is 500 calls a month with no card; the credential test makes one call.

## Operations

| Resource | Operation | Endpoint |
|---|---|---|
| Vedic Astrology | Natal Chart | `POST /v1/astro/natal` |
| Vedic Astrology | Matchmaking (Kundali Milan) | `POST /v1/astro/matchmaking` |
| Vedic Astrology | Panchanga | `POST /v1/astro/panchanga` |
| Western Astrology | Natal Chart | `POST /v1/western/natal` |
| Numerology | Profile | `POST /v1/numerology/profile` |
| Custom | Raw Request | any path, POST body or GET query as JSON |

Birthplaces are plain text; the API geocodes them and resolves the time zone. Leave the time empty when it is unknown and the API casts a sunrise chart, flagging `birth_time_provided: false` in the response.

The matchmaking output carries `classical_vetoes` next to `total_score`. Rajju or Vedha between the two Moon nakshatras is a stop in the classical method, not a point deduction, so a 30/36 with Rajju present is not a good match. Background: [Rajju and Vedha as hard vetoes](https://asterwise.com/blog/rajju-vedha-hard-vetoes/).

## Example: WhatsApp-style daily panchanga

Schedule Trigger (every day 06:00) → Asterwise (Panchanga, date `{{ $today.toFormat('yyyy-MM-dd') }}`, location `New Delhi, India`) → your messaging node with `{{ $json.data.tithi.name }}`, `{{ $json.data.nakshatra.name }}`.

## Accuracy

Every Asterwise position is computed with the Swiss Ephemeris and [checked against NASA JPL Horizons](https://asterwise.com/accuracy/): 80 positions from 1950 to 2050, median difference 0.046 arcseconds, raw data and script published.

## Develop

```bash
npm install
npm run build     # compiles to dist/ and copies icons
npm run lint      # n8n community-node lint rules
npm test          # structural check of the compiled node and credential
```

MIT licensed. Asterwise API use is governed by the [Asterwise terms](https://asterwise.com/terms/).
