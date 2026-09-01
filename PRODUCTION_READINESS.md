# Prudentist static-site production readiness and launch plan

Last updated: September 1, 2026 (America/Los_Angeles)

## Executive decision

Prudentist is now a static website and should launch on **GitHub Pages for $0/month**.

The deployed site consists only of HTML, CSS, vanilla JavaScript, images, and crawler metadata. It has no application server, package installation, container, build pipeline, database, persistent disk, or paid cloud runtime. Google Forms stores survey/early-access responses; Google Analytics 4 provides traffic visibility after consent.

| Area | Status | Owner action required |
|---|---|---|
| Static HTML/CSS/JS conversion | Complete | None |
| Branded native forms → Google Forms bridge | Complete and deployed | Re-test after any Form question changes |
| GA4 and automatic click tracking | Complete but disabled | Paste the `G-` Measurement ID |
| Raw-IP handling | Intentionally not collected | Leave optional coarse lookup off unless reviewed |
| SEO, social metadata, sitemap, robots | Complete | Update canonical URLs if a fallback domain is chosen |
| GitHub Pages compatibility | Complete and live | None |
| Preferred domain | Registered to another party | Acquire it or select a fallback |
| Local browser QA | Complete — desktop and mobile passed | Repeat on the public URL after launch |

The complete beginner setup instructions are in `README.md`.

## Architecture delivered

```text
Visitor
  ├─ HTML/CSS/images ───────── GitHub Pages global static hosting
  ├─ branded survey form ───── Apps Script bridge → Google Forms → private Google Sheet
  ├─ branded early-access form Apps Script bridge → Google Forms → private Google Sheet
  └─ consented analytics ───── GA4 page/click/location reports
```

Key production files:

- `index.html`: content, metadata, JSON-LD, GA4 configuration, and native branded forms.
- `privacy.html`: Google Forms, GA4, and optional location disclosure.
- `static/styles.css`: the single responsive stylesheet.
- `static/site.js`: navigation, nonce-validated form bridge, consent, GA4, click events, and optional coarse lookup.
- `apps-script/Code.gs`: deployed server-side Google Forms bridge; it contains no browser credential.
- `robots.txt`, `sitemap.xml`, `404.html`, `.nojekyll`, and `.well-known/security.txt`.

The old SQLite file is preserved locally under `instance/` so existing information is not destroyed. It is Git-ignored and is neither used nor published.

## Forms and analytics behavior

The website retains its own accessible, responsive form UI. On submit it makes a normal cross-origin form navigation to a hidden Apps Script iframe; Apps Script validates and writes the response to the private Google Forms, which continue to populate the linked Sheets. A cryptographic nonce and a restricted `postMessage` origin provide an actual confirmed-success or error state without an unsafe CORS workaround or browser-exposed Google credential.

The deployed Apps Script web-app endpoint is configured in `index.html`. It is limited to the Pages preview and the intended `prudentist.in` origins. The bridge has a honeypot and a 60-second per-email duplicate throttle; add a server-verified bot-control service before any high-volume campaign.

GA4 remains inert while `G-XXXXXXXXXX` is present. Once replaced:

- a visitor can allow or decline analytics;
- Do Not Track disables it;
- declined/accepted choice is stored locally;
- Google Signals and advertising personalization are disabled;
- page views come from GA4;
- `site_click` captures labels, destinations, and outbound status;
- `form_submission_confirmed` records confirmed bridge successes without including form answers.

### IP-address decision

Raw IP collection is not implemented. GA4 already uses network information to derive approximate city/region/country and does not expose individual IP addresses. Passing raw IP into GA4 would create an unnecessary privacy and policy risk.

An optional `ipapi.co` client lookup is included but disabled. If enabled, it runs only after analytics consent, discards the returned IP field, logs city/region/country in the browser console, and sends those coarse fields as `coarse_location`. It should remain off unless there is a concrete need; the extra provider receives the visitor’s network address simply because the browser connects to it.

## Hosting decision after hyperscaler review

The earlier server-hosting recommendation is obsolete because the application no longer has a server or database.

| Host | Cost for this site | Build/runtime | Custom domain/TLS | Recommendation |
|---|---:|---|---|---|
| **GitHub Pages** | **$0** for a public repository | None | Included | **Recommended: simplest and sufficient** |
| Netlify Free | $0 within free limits | None | Included | Good if deploy previews/forms features are later desired |
| Vercel Hobby | $0 within plan terms | None | Included | Technically good; review Hobby commercial-use terms before business launch |
| GCP/Firebase Hosting | Usually $0 in quota | Firebase project/CLI | Included | No product benefit for this raw static site |
| AWS S3 + CloudFront | Low but not zero | Several cloud resources | Included with setup | Unnecessary operational surface |
| Azure Static Web Apps | Free tier available | Azure resource/workflow | Included | Also more setup than needed |

GitHub recommends “Deploy from a branch” when no build control is needed. Select `main` and `/(root)` under repository Settings → Pages. The live preview will be `https://YOUR_USERNAME.github.io/prudentist/`.

## Domain acquisition: verified status and buyer price

### Current facts

The [authoritative .IN RDAP record](https://rdap.nixiregistry.in/rdap/domain/prudentist.in), checked September 1, 2026, shows that `prudentist.in`:

- is registered through GoDaddy;
- was registered November 1, 2023;
- is paid through November 1, 2033;
- lists registrant organization `Dr Santosh`, Karnataka, India;
- has transfer, update, renewal, and deletion locks;
- uses `ns7.l4dns.com` and `ns8.l4dns.com`;
- currently resolves to an active site at `129.80.154.173`.

It is not available at ordinary registration price, is not near expiration, and has no public buy-now price. The exact price is unknowable until the owner responds. An appraisal is not an offer.

### Acquisition cost formula

[GoDaddy Domain Broker Service](https://www.godaddy.com/domains/domain-broker) currently charges:

- $99.99 non-refundable to open the case;
- 20% commission on the negotiated sale price;
- the broker works for up to 30 days;
- success is not guaranteed.

Total before tax/currency conversion:

`$99.99 + seller price + (seller price × 20%)`

| Accepted seller price | Buyer total before tax |
|---:|---:|
| $500 | $699.99 |
| $1,000 | $1,299.99 |
| $1,500 | $1,899.99 |
| $2,500 | $3,099.99 |
| $5,000 | $6,099.99 |

Recommended negotiating authority: open at **$500** with a private ceiling of **$1,500**, making the maximum planned checkout approximately **$1,899.99 plus tax**. That is a budget recommendation, not a market valuation or owner quote. Because the name is active and registered for ten years, the owner may reject it or ask substantially more.

### Exact acquisition steps

1. Confirm no Prudentist team member knows or controls the listed registrant. If the team controls it, use a GoDaddy account change and skip brokerage.
2. Create the receiving GoDaddy account under a company-controlled email. Enable passkeys/two-factor authentication and protect recovery codes.
3. Open [GoDaddy’s broker page](https://www.godaddy.com/domains/domain-broker), enter `prudentist.in`, pay $99.99, and provide the $500 opening offer plus the approved private ceiling.
4. Do not reveal the product plan or ceiling to the registrant. Let the broker keep buyer identity and leverage confidential.
5. Before accepting, require confirmation that the domain has no lease, financing, dispute, or unresolved ownership claim and that delivery to the receiving GoDaddy account is included.
6. Review the spelling, seller price, 20% commission, taxes, and destination account before payment. Do not bypass GoDaddy or reputable escrow to pay the owner directly.
7. As the registrar is already GoDaddy, brokered delivery normally uses an account change. If an external registrar is used, the owner must remove the transfer lock and supply a 6–16 character auth code. The [.IN registry](https://www.registry.in/domain-name-transfer) says a registrar transfer normally completes in five 24-hour periods.
8. After receipt, change registrant/contact details, enable auto-renew, retain transfer/update locks, add a backup payment method, and retain the receipt.
9. Verify the domain in GitHub before pointing DNS to avoid takeover risk. Export the old DNS zone and preserve MX, SPF, DKIM, DMARC, and unrelated TXT records.

If the seller refuses or exceeds the ceiling, use a fallback. `prudentist.co.in`, `getprudentist.in`, and `prudentistdental.in` returned RDAP “not found” during this review, but they are not reserved and must be reconfirmed at checkout. [Namecheap currently lists ordinary `.in`](https://www.namecheap.com/domains/registration/cctld/in/) at $9.98 for year one and $11.98/year renewal; registrar prices change.

## SEO launch sequence

Delivered:

- unique title and meta description;
- index/follow robots policy;
- canonical URLs;
- Open Graph and X/Twitter cards;
- `EducationalOrganization` JSON-LD;
- semantic landmarks and one H1;
- crawlable text without client rendering;
- sitemap, robots, privacy, manifest, favicon, 404, and security contact;
- relative asset paths compatible with GitHub project Pages.

After the final domain is known:

1. If it is not `www.prudentist.in`, replace that origin in `index.html`, `privacy.html`, `robots.txt`, `sitemap.xml`, and `.well-known/security.txt`.
2. Add the property to Google Search Console. A Domain property uses DNS verification and covers apex/subdomains/protocols.
3. Submit `/sitemap.xml` and inspect the home/privacy URLs.
4. Add Bing Webmaster Tools by importing the Search Console property.
5. Validate the social image with LinkedIn and Facebook sharing debuggers.
6. Review GA4 Realtime, form responses, mobile usability, indexing, and Core Web Vitals after launch.

## Local performance baseline

The static build was checked on September 1, 2026 at desktop and 390×844 mobile widths. It returned HTTP 200 with no browser-console errors, no horizontal overflow, one H1, valid SEO metadata and JSON-LD, native branded forms, and a working keyboard-closeable mobile menu. The deployed bridge also accepted a marked end-to-end survey verification response.

| Metric | Local result |
|---|---:|
| Time to first byte | 1 ms |
| DOM ready | 106 ms |
| Full load | 106 ms |
| Requests | 4 |
| Transfer | 70,593 bytes |

Recheck the public deployment with Lighthouse and PageSpeed Insights. Configured Google Form iframes and consented GA4 will add third-party requests, although form loading is lazy and analytics is consent-gated to protect the initial page.

## Final launch checklist

- [x] Create, publish, and link the two Google Forms to private response Sheets.
- [x] Deploy the nonce-validated Apps Script bridge and configure the public endpoint.
- [ ] Create the GA4 property/stream and paste the Measurement ID.
- [ ] Review the final privacy wording; keep raw-IP collection disabled.
- [x] Create the public GitHub repository, publish the static site, and enable Pages.
- [ ] Test both native forms from a signed-out/private browser and confirm rows appear in Sheets after this release.
- [ ] Confirm analytics consent, decline, Do Not Track, Realtime, and click events.
- [ ] Approve the domain acquisition ceiling and open the broker case, or purchase a fallback.
- [ ] Verify the acquired domain in GitHub, attach `www`, configure apex records, and enforce HTTPS.
- [ ] Update canonical/sitemap/GA4 URLs if a fallback domain is used.
- [ ] Verify Search Console and submit the sitemap.
- [ ] Repeat mobile, accessibility, console, link, and performance checks on the public URL.
