# Prudentist static website

Prudentist is now a zero-build static website: semantic HTML, one CSS file, one vanilla JavaScript file, and image assets. Production needs no Python, Node.js, container, database, or paid application host.

## Files to publish

- `index.html` — landing page, SEO metadata, Google Form and GA4 configuration
- `privacy.html` — privacy disclosure
- `404.html` — GitHub Pages fallback
- `robots.txt` and `sitemap.xml` — search-crawler instructions
- `.nojekyll` and `.well-known/security.txt` — static-host behavior and security contact
- `static/styles.css`, `static/site.js`, `static/site.webmanifest`, and `static/images/` — presentation and assets

`instance/prudentist.sqlite3` is retained locally only to avoid destroying historical data. It is ignored by Git and is not needed or published.

## Preview locally

From this directory:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. Python is only a convenient local file server; the deployed site has no Python dependency.

## 1. Create the Google Forms

Create two forms at [forms.google.com](https://forms.google.com/). Keep them separate so survey responses and qualified early-access leads remain easy to review.

Suggested **Dentist needs survey** questions:

1. Which path best fits you? — multiple choice: Prudentist Clinical, Prudentist Global, still exploring.
2. Where are you right now? — dental student, new graduate, practicing dentist, U.S. pathway, Canada pathway.
3. What is your biggest challenge right now? — paragraph.
4. What training would help most? — multiple choice.
5. Would you consider joining a focused pilot? — yes, maybe, not yet.
6. Email — optional short answer with email validation.

Suggested **Prudentist early access** questions:

1. Name.
2. Country.
3. Email.
4. WhatsApp.
5. Dental school.
6. Graduation year.
7. Current status.
8. Path of interest.
9. Primary goal.
10. Biggest current challenge.
11. Training wanted most.

Both production forms are now published and connected to private response Sheets. Their public embed URLs are configured in `index.html`. For future form maintenance:

1. Open **Settings** and decide whether to collect email addresses. Do not require Google sign-in unless that is intentional; sign-in adds conversion friction.
2. Do not add a file-upload question; visitors should never submit patient records.
3. Publish the form and set responder access to anyone with the link.
4. Open **Responses** → **Link to Sheets** to create a private response spreadsheet.
5. Open the top-right **More** menu → **Embed HTML** and copy the iframe HTML. Google documents the current flow in [Publish and share your form](https://support.google.com/docs/answer/2839588).
6. From the copied iframe, copy only the URL between `src="` and the next `"`. It normally begins with `https://docs.google.com/forms/` and ends with `embedded=true`.
7. Open `index.html` and find `window.PRUDENTIST_CONFIG` near the top. Update the two existing URLs:

```javascript
surveyFormUrl: 'https://docs.google.com/forms/.../viewform?embedded=true',
waitlistFormUrl: 'https://docs.google.com/forms/.../viewform?embedded=true',
```

The site creates accessible, responsive iframes automatically. Until URLs are added, visible setup placeholders remain instead of broken empty frames.

Google Forms is cross-origin, so this page cannot reliably observe the final submit button inside the iframe. Use the Google Form response count/linked Sheet for completion numbers; GA4 tracks page views, site clicks, and successful iframe loads.

## 2. Create and connect GA4

1. Go to [analytics.google.com](https://analytics.google.com/) and select **Admin**.
2. Create an account/property named Prudentist if needed.
3. Under **Data streams**, add a **Web** stream.
4. Enter the temporary GitHub Pages URL initially; update it to `https://www.prudentist.in` after the domain is connected.
5. Leave Enhanced Measurement enabled.
6. Copy the Measurement ID beginning with `G-`. Google’s current steps are in [Set up Analytics for a website](https://support.google.com/analytics/answer/14183469).
7. In `index.html`, replace:

```javascript
gaMeasurementId: 'G-XXXXXXXXXX',
```

The GA script is not downloaded while the placeholder remains. Once configured, the site shows a small analytics choice. Accepting it loads GA4; declining stores only that choice locally. Do Not Track disables analytics. Advertising personalization and Google Signals are disabled in code.

Automatic custom event: `site_click`, with link label, URL, and outbound status. Embedded frame load event: `google_form_loaded`.

### About IP addresses

Do not send raw IP addresses to GA4 or store them in Google Sheets. GA4 already derives country/region/city from network information and does not expose individual IPs. The optional `ipapi.co` lookup in `static/site.js` deliberately discards the returned IP. It is off by default:

```javascript
enableCoarseGeoLookup: false
```

If enabled, it runs only after analytics consent, logs coarse city/region/country to the console, and sends those fields as `coarse_location`. Enabling it discloses the visitor’s network address to ipapi.co, so leave it disabled unless there is a specific need and the privacy approach has been reviewed.

## 3. Publish on GitHub Pages for $0/month

### Create and upload the repository

1. Create a free GitHub account if needed.
2. On GitHub, click **New repository**.
3. Name it `prudentist`, set it to **Public**, and create it without starter files.
4. In a terminal in this directory, run:

```bash
git init
git add .
git commit -m "Launch Prudentist static site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/prudentist.git
git push -u origin main
```

Before `git add`, confirm the ignored `instance/` database and `.venv/` do not appear in `git status`.

### Turn on Pages

1. Open the repository on GitHub.
2. Go to **Settings** → **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/(root)`, then click **Save**. This is GitHub’s documented [branch publishing flow](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
5. Wait for the Pages deployment to finish, then open `https://YOUR_USERNAME.github.io/prudentist/`.
6. Test desktop/mobile navigation, both embedded forms, their linked response Sheets, the privacy page, and GA4 **Reports → Realtime**.

Relative asset links are used so the site works both under `/prudentist/` and at a future custom domain.

## 4. Connect the custom domain after acquisition

Do not change DNS until the domain is legally in the team’s GoDaddy account and the GitHub Pages preview works.

1. In GitHub account or organization **Settings** → **Pages**, verify `prudentist.in` with the TXT record GitHub supplies. Keep that TXT record permanently to prevent domain takeover.
2. In the repository **Settings** → **Pages**, enter `www.prudentist.in` under **Custom domain** and save. GitHub will create a root `CNAME` file.
3. In GoDaddy DNS, create `CNAME` host `www` pointing directly to `YOUR_USERNAME.github.io`—do not include `/prudentist`.
4. For the apex `prudentist.in`, add these GitHub Pages A records:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

5. Preserve email and verification TXT/MX records. Do not create wildcard DNS records.
6. Wait for DNS checks and certificate issuance, then select **Enforce HTTPS**. GitHub documents the current records and redirect behavior in [Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
7. Confirm both `https://prudentist.in` and `https://www.prudentist.in` resolve, with one redirecting to the other.
8. Update GA4’s web-stream URL, verify Google Search Console, and submit `https://www.prudentist.in/sitemap.xml`.

## Ongoing edits

Edit the HTML/CSS/JS directly, preview locally, then:

```bash
git add .
git commit -m "Describe the change"
git push
```

GitHub Pages republishes automatically. There is no build command, server process, database migration, or cloud bill.
