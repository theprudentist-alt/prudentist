# Prudentist Google Forms bridge

This Apps Script project accepts the two branded website forms and submits the answers into the existing Google Forms. Their existing Google Sheets response destinations continue to work.

## CORS design

The public site never calls Apps Script with `fetch()` and never uses `mode: "no-cors"`. Instead it posts a regular HTML form into a hidden iframe. A cross-origin form navigation is permitted by browsers, then Apps Script sends a nonce-bound `postMessage` to the exact parent origin. The page accepts only messages from `script.google.com` or a `*.googleusercontent.com` response frame and only if the nonce matches the request it initiated.

This means the visitor receives an actual confirmed-success or error state without attempting to read a cross-origin HTTP response or exposing Google credentials in the browser.

## Deploy

1. Open [script.new](https://script.new) while signed into the Google account that owns the two Forms.
2. Name the project `Prudentist Form Bridge`.
3. Replace the default `Code.gs` with this directory's `Code.gs` and save.
4. Choose **Deploy → New deployment → Web app**.
5. Set **Execute as** to **Me** and **Who has access** to **Anyone**. Authorize the Forms scope when Google asks.
6. Copy the resulting URL ending in `/exec` into `window.PRUDENTIST_CONFIG.formEndpoint` in `index.html`.
7. Republish the static site, submit one test response per form, and verify the rows in both linked Sheets.

Use **Manage deployments → Edit** for future script changes, then create a new version and retain the `/exec` URL.

## Form maintenance

The bridge matches each question by its exact Google Form title and validates expected choice values on Google Forms' side. If a title or multiple-choice option changes, update the corresponding `title` or native HTML option in both places, deploy a new Apps Script version, and re-test.

For a higher-volume launch, add a real bot-control service before the bridge (for example Cloudflare Turnstile with server-side token validation). The included honeypot and one-minute duplicate throttle are intentionally modest protections for this early interest-gauging site.
