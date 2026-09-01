const config = window.PRUDENTIST_CONFIG || {};
const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

if (header) {
  const updateHeader = () => header.classList.toggle('scrolled', scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

if (menuButton && menu) {
  const closeMenu = (restoreFocus = false) => {
    menu.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('.sr-only').textContent = 'Open navigation';
    if (restoreFocus) menuButton.focus();
  };

  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('.sr-only').textContent = open ? 'Close navigation' : 'Open navigation';
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('open')) closeMenu(true);
  });
}

const measurementId = String(config.gaMeasurementId || '').trim();
const hasMeasurementId = /^G-[A-Z0-9]{6,}$/i.test(measurementId) && measurementId !== 'G-XXXXXXXXXX';
const consentKey = 'prudentist_analytics_consent';
let analyticsReady = false;

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

const track = (eventName, parameters = {}) => {
  if (!analyticsReady || navigator.doNotTrack === '1') return;
  window.gtag('event', eventName, parameters);
};

const loadAnalytics = () => {
  if (!hasMeasurementId || analyticsReady || navigator.doNotTrack === '1') return;
  analyticsReady = true;
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);
  lookupCoarseLocation();
};

const saveConsent = (choice) => {
  localStorage.setItem(consentKey, choice);
  document.querySelector('[data-consent-banner]')?.remove();
  if (choice === 'accepted') loadAnalytics();
};

const showConsent = () => {
  if (!hasMeasurementId || navigator.doNotTrack === '1') return;
  const banner = document.createElement('aside');
  banner.className = 'consent-banner';
  banner.dataset.consentBanner = '';
  banner.setAttribute('aria-label', 'Analytics choice');
  banner.innerHTML = `
    <p>Prudentist uses Google Analytics to understand visits and improve this site. <a href="privacy.html">Privacy details</a>.</p>
    <div><button class="button button-small" type="button" data-consent="accepted">Allow analytics</button><button class="consent-decline" type="button" data-consent="declined">No thanks</button></div>`;
  banner.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-consent]')?.dataset.consent;
    if (choice) saveConsent(choice);
  });
  document.body.append(banner);
};

if (hasMeasurementId) {
  const consent = localStorage.getItem(consentKey);
  if (consent === 'accepted') loadAnalytics();
  else if (consent !== 'declined') showConsent();
}

const formEndpoint = String(config.formEndpoint || '').trim();
const hasFormEndpoint = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/i.test(formEndpoint);
const appsScriptOrigin = (origin) => {
  try {
    const host = new URL(origin).hostname;
    return host === 'script.google.com' || host.endsWith('.googleusercontent.com');
  } catch {
    return false;
  }
};
const formFields = {
  survey: ['path', 'stage', 'challenge', 'training', 'pilot', 'email', 'company'],
  waitlist: ['name', 'country', 'email', 'dentalSchool', 'graduationYear', 'currentStatus', 'pathOfInterest', 'primaryGoal', 'challenge', 'training', 'whatsApp', 'company']
};

const createNonce = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const setFormStatus = (panel, message, type = '') => {
  const status = panel.querySelector('[data-form-status]');
  if (!status) return;
  status.textContent = message;
  status.className = `form-status${type ? ` ${type}` : ''}`;
};

document.querySelectorAll('[data-prudentist-form]').forEach((form) => {
  const formName = form.dataset.prudentistForm;
  const panel = form.closest('[data-form-panel]');
  const submitButton = form.querySelector('[type="submit"]');
  if (!panel || !submitButton || !formFields[formName]) return;

  if (!hasFormEndpoint) {
    setFormStatus(panel, 'This form is being connected. Please try again shortly.', 'error');
    submitButton.disabled = true;
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const values = Object.fromEntries(new FormData(form).entries());
    const honeypot = String(values.company || '').trim();
    if (honeypot) {
      panel.classList.add('is-complete');
      setFormStatus(panel, 'Thank you for sharing your perspective.', 'success');
      return;
    }

    const fields = {};
    formFields[formName].forEach((field) => {
      if (field !== 'company' && values[field] !== undefined) fields[field] = String(values[field]).trim();
    });
    const nonce = createNonce();
    const frameName = `prudentist-submit-${nonce}`;
    const frame = document.createElement('iframe');
    frame.name = frameName;
    frame.hidden = true;
    frame.title = 'Form submission';
    document.body.append(frame);

    const transport = document.createElement('form');
    transport.method = 'post';
    transport.action = formEndpoint;
    transport.target = frameName;
    transport.hidden = true;
    const addField = (name, value) => {
      const input = document.createElement('input');
      input.name = name;
      input.value = value;
      transport.append(input);
    };
    addField('payload', JSON.stringify({ formName, fields, nonce, parentOrigin: location.origin }));
    document.body.append(transport);

    let settled = false;
    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeout);
      transport.remove();
      frame.remove();
    };
    const finish = (ok, message) => {
      if (settled) return;
      settled = true;
      cleanup();
      submitButton.disabled = false;
      if (ok) {
        form.reset();
        panel.classList.add('is-complete');
        setFormStatus(panel, message || 'Thank you. Your response has been received.', 'success');
        track('form_submission_confirmed', { form_name: formName });
      } else {
        setFormStatus(panel, message || 'We could not submit that response. Please try again.', 'error');
      }
    };
    const onMessage = (messageEvent) => {
      const data = messageEvent.data;
      if (!appsScriptOrigin(messageEvent.origin) || !data || data.type !== 'prudentist_form_result' || data.nonce !== nonce) return;
      finish(Boolean(data.ok), String(data.message || ''));
    };
    const timeout = window.setTimeout(() => finish(false, 'We could not confirm your submission. Please try again.'), 25000);
    window.addEventListener('message', onMessage);
    submitButton.disabled = true;
    setFormStatus(panel, 'Submitting securely…');
    transport.submit();
  });
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('a, button');
  if (!target || target.closest('[data-consent-banner]')) return;
  const url = target instanceof HTMLAnchorElement ? new URL(target.href, location.href) : null;
  const outbound = url && url.origin !== location.origin;
  const label = (target.dataset.event || target.textContent || target.getAttribute('aria-label') || 'unlabelled')
    .trim().replace(/\s+/g, ' ').slice(0, 80);
  track('site_click', {
    click_label: label,
    link_url: url ? url.href.slice(0, 200) : undefined,
    outbound: Boolean(outbound)
  });
});

async function lookupCoarseLocation() {
  if (!config.enableCoarseGeoLookup || !analyticsReady || navigator.doNotTrack === '1') return;
  if (sessionStorage.getItem('prudentist_geo_checked')) return;
  sessionStorage.setItem('prudentist_geo_checked', '1');
  try {
    const response = await fetch('https://ipapi.co/json/', { mode: 'cors', credentials: 'omit' });
    if (!response.ok) return;
    const { city, region_code: regionCode, country_code: countryCode } = await response.json();
    const coarseLocation = { city, region_code: regionCode, country_code: countryCode };
    console.info('Approximate visitor location (IP discarded):', coarseLocation);
    track('coarse_location', coarseLocation);
  } catch (error) {
    console.info('Approximate location lookup unavailable.');
  }
}

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
}
