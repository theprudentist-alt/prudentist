const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Regression: ISSUE-001 — the custom domain was rejected by the Forms bridge.
// Found by /qa on 2026-09-16.
const context = vm.createContext({
  HtmlService: {
    XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
    createHtmlOutput: html => ({ setXFrameOptionsMode: () => html })
  }
});
vm.runInContext(fs.readFileSync('apps-script/Code.gs', 'utf8'), context);
const request = origin => ({
  parentOrigin: origin, nonce: 'a'.repeat(36), formName: 'survey',
  fields: { path: 'Prudentist Clinical', stage: 'New graduate',
    challenge: 'QA test', training: 'Mentorship and accountability', pilot: 'Not yet' }
});

for (const origin of ['https://prudentist.co.in', 'https://www.prudentist.co.in', 'https://theprudentist-alt.github.io']) {
  test(`accepts and returns receipts to ${origin}`, () => {
    const payload = request(origin);
    assert.doesNotThrow(() => context.validateRequest_(payload));
    for (const ok of [true, false]) {
      const html = context.receipt_(payload, ok, 'Test receipt');
      assert.ok(html.includes(`, ${JSON.stringify(origin)})`));
      assert.ok(html.includes(`"ok":${ok}`));
      assert.ok(html.includes(`"nonce":"${payload.nonce}"`));
    }
  });
}
for (const origin of ['https://prudentist.in', 'http://prudentist.co.in', 'https://prudentist.co.in.evil.example']) {
  test(`rejects unapproved origin ${origin}`, () => {
    assert.throws(() => context.validateRequest_(request(origin)), /Unapproved origin/);
  });
}
