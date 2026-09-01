/**
 * Prudentist Google Forms bridge
 *
 * Deploy this as a Web app that executes as the script owner and is accessible
 * to anyone. The public site sends a regular form POST into a hidden iframe;
 * the response uses postMessage to report a nonce-bound result to the parent.
 * This deliberately avoids unsupported direct Google Forms POSTs and does not
 * use fetch({ mode: 'no-cors' }).
 */
const PRUDENTIST = Object.freeze({
  allowedParentOrigins: [
    'https://theprudentist-alt.github.io',
    'https://www.prudentist.in',
    'https://prudentist.in'
  ],
  forms: {
    survey: {
      id: '19pEYwn8Dp0cu3Bm4fSuQp11bTIlNGf0hO9cp3UuAdqk',
      fields: {
        path: { title: 'Which path best fits you?', required: true, max: 100 },
        stage: { title: 'Where are you right now?', required: true, max: 100 },
        challenge: { title: 'What is your biggest challenge right now?', required: true, max: 1200 },
        training: { title: 'What training would help most?', required: true, max: 100 },
        pilot: { title: 'Would you consider joining a focused pilot?', required: true, max: 30 },
        email: { title: 'Email (optional)', required: false, max: 254, email: true }
      }
    },
    waitlist: {
      id: '1EjU9aNnnFrNZ6pZ1OyNUAOYBiS0rUdw95SECUO12tPk',
      fields: {
        name: { title: 'Name', required: true, max: 120 },
        country: { title: 'Country', required: true, max: 120 },
        email: { title: 'Email', required: true, max: 254, email: true },
        dentalSchool: { title: 'Dental school', required: true, max: 200 },
        graduationYear: { title: 'Graduation year', required: true, max: 4, year: true },
        currentStatus: { title: 'Current status', required: true, max: 160 },
        pathOfInterest: { title: 'Path of interest', required: true, max: 160 },
        primaryGoal: { title: 'Primary goal', required: true, max: 300 },
        challenge: { title: 'Biggest current challenge', required: true, max: 1200 },
        training: { title: 'Training wanted most', required: true, max: 300 },
        whatsApp: { title: 'WhatsApp number (optional)', required: false, max: 40 }
      }
    }
  }
});

function doGet() {
  return ContentService.createTextOutput('Prudentist form bridge is running.');
}

function doPost(e) {
  let request = {};
  try {
    request = JSON.parse(String(e && e.parameter && e.parameter.payload || ''));
    validateRequest_(request);
    rateLimit_(request);
    submitToGoogleForm_(request);
    return receipt_(request, true, 'Thank you. Your response has been received.');
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return receipt_(request, false, 'We could not submit that response. Please try again.');
  }
}

function validateRequest_(request) {
  if (!request || typeof request !== 'object') throw new Error('Invalid request.');
  if (!PRUDENTIST.allowedParentOrigins.includes(request.parentOrigin)) throw new Error('Unapproved origin.');
  if (!/^[a-f0-9]{36}$/i.test(String(request.nonce || ''))) throw new Error('Invalid nonce.');
  if (!PRUDENTIST.forms[request.formName]) throw new Error('Unknown form.');
  if (!request.fields || typeof request.fields !== 'object') throw new Error('Missing fields.');

  const definition = PRUDENTIST.forms[request.formName];
  Object.keys(definition.fields).forEach((name) => {
    const rule = definition.fields[name];
    const value = String(request.fields[name] || '').trim();
    if (rule.required && !value) throw new Error(`Missing ${name}.`);
    if (value.length > rule.max) throw new Error(`Invalid ${name}.`);
    if (rule.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Invalid email.');
    if (rule.year && !/^(19|20)\d{2}$/.test(value)) throw new Error('Invalid graduation year.');
  });
}

function rateLimit_(request) {
  const email = String(request.fields.email || '').trim().toLowerCase();
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, `${request.formName}:${email}`)
    .map((byte) => (byte + 256).toString(16).slice(-2)).join('');
  const key = `prudentist:${digest}`;
  const cache = CacheService.getScriptCache();
  if (cache.get(key)) throw new Error('Please wait before submitting again.');
  cache.put(key, '1', 60);
}

function submitToGoogleForm_(request) {
  const definition = PRUDENTIST.forms[request.formName];
  const form = FormApp.openById(definition.id);
  const items = form.getItems();
  let response = form.createResponse();

  Object.keys(definition.fields).forEach((name) => {
    const rule = definition.fields[name];
    const value = String(request.fields[name] || '').trim();
    if (!value) return;
    const item = items.find((candidate) => candidate.getTitle() === rule.title);
    if (!item) throw new Error(`Form item not found: ${rule.title}`);
    response = response.withItemResponse(createItemResponse_(item, value));
  });
  response.submit();
}

function createItemResponse_(item, value) {
  switch (item.getType()) {
    case FormApp.ItemType.TEXT:
      return item.asTextItem().createResponse(value);
    case FormApp.ItemType.PARAGRAPH_TEXT:
      return item.asParagraphTextItem().createResponse(value);
    case FormApp.ItemType.MULTIPLE_CHOICE:
      return item.asMultipleChoiceItem().createResponse(value);
    case FormApp.ItemType.LIST:
      return item.asListItem().createResponse(value);
    default:
      throw new Error(`Unsupported form item type: ${item.getType()}`);
  }
}

function receipt_(request, ok, message) {
  const nonce = /^[a-f0-9]{36}$/i.test(String(request.nonce || '')) ? request.nonce : '';
  const parentOrigin = PRUDENTIST.allowedParentOrigins.includes(request.parentOrigin)
    ? request.parentOrigin
    : 'https://theprudentist-alt.github.io';
  const result = JSON.stringify({ type: 'prudentist_form_result', ok: Boolean(ok), nonce, message });
  const target = JSON.stringify(parentOrigin);
  const html = `<!doctype html><html><body><script>window.top.postMessage(${result}, ${target});</script></body></html>`;
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
