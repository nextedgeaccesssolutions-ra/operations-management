/**
 * End-to-end checks against a real build in a real browser.
 *
 * Run:  npm run build && npm run preview &   then   node tests/e2e.mjs
 * Or:   npm run test:e2e   (builds, serves, runs, tears down)
 *
 * Every assertion here drives the actual UI. Nothing is stubbed, and a check
 * is only reported as passing if its expectation was observed in the page.
 */

import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4173';
const SHOT_DIR = process.env.E2E_SHOTS ?? 'tests/screenshots';

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const stamp = Date.now();
const COMPANY = `E2E Access Co ${stamp}`;
const OWNER = { name: 'Owner One', email: `owner${stamp}@e2e.test`, password: 'correct-horse-staple-99' };
const JOINER = { name: 'Joiner Two', email: `joiner${stamp}@e2e.test`, password: 'another-long-secret-77' };

async function fillSignup(page, who, company) {
  await page.getByRole('button', { name: 'Request Access' }).first().click();
  await page.locator('#su-name').fill(who.name);
  await page.locator('#su-company').fill(company);
  await page.locator('#su-email').fill(who.email);
  await page.locator('#su-password').fill(who.password);
  await page.locator('#su-confirm').fill(who.password);
  await page.locator('button[type=submit]').click();
}

const browser = await chromium.launch();
const consoleErrors = [];

try {
  /* ── 1. the gate ──────────────────────────────────────────────── */
  console.log('\nAuthentication gate');
  const ownerCtx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ownerCtx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });

  const bodyText = await page.locator('body').innerText();
  check('an unauthenticated visitor gets the sign-in screen', bodyText.includes('NEAS Virtual Office'));
  check(
    'the office is not rendered before sign-in',
    !bodyText.includes('Executive Center') && !bodyText.includes('Workforce Control'),
    'sidebar leaked to an anonymous visitor'
  );
  check(
    'no demo backdoor is offered',
    !/demo@neas\.co|demo credentials|demo123/i.test(bodyText),
    'a seeded credential is still advertised'
  );
  check(
    'the storage claim is accurate, not a Blob/RLS claim',
    bodyText.includes('PBKDF2') && !/Blob store/i.test(bodyText)
  );
  await page.screenshot({ path: `${SHOT_DIR}/01-signin.png` });

  /* ── 2. weak passwords are refused ────────────────────────────── */
  console.log('\nPassword policy');
  await page.getByRole('button', { name: 'Request Access' }).first().click();
  await page.locator('#su-name').fill('Weak Pass');
  await page.locator('#su-company').fill(COMPANY);
  await page.locator('#su-email').fill(`weak${stamp}@e2e.test`);
  await page.locator('#su-password').fill('admin12345');
  await page.locator('#su-confirm').fill('admin12345');
  await page.locator('button[type=submit]').click();
  await page.waitForTimeout(400);
  const weakMsg = await page.locator('[role=alert]').innerText().catch(() => '');
  check('a common-word password is rejected', /common word/i.test(weakMsg), weakMsg || 'no alert shown');

  await page.locator('#su-password').fill('short1');
  await page.locator('#su-confirm').fill('short1');
  await page.locator('button[type=submit]').click();
  await page.waitForTimeout(400);
  const shortMsg = await page.locator('[role=alert]').innerText().catch(() => '');
  check('a short password is rejected', /at least 10/i.test(shortMsg), shortMsg || 'no alert shown');

  /* ── 3. first account for a company owns it ───────────────────── */
  console.log('\nFirst account becomes the owner');
  await page.reload({ waitUntil: 'networkidle' });
  await fillSignup(page, OWNER, COMPANY);
  await page.waitForTimeout(1200);

  const afterOwner = await page.locator('body').innerText();
  check('the owner lands in the office, not in a waiting room', afterOwner.includes('Executive Center'));
  check('the owner is not left pending', !afterOwner.includes('Waiting for approval'));
  check('the header shows the real signed-in person, not a hardcoded CEO', afterOwner.includes(OWNER.name));
  check('the owner role is shown', /owner/i.test(afterOwner));
  check('the company name reaches the sidebar', afterOwner.includes(COMPANY));
  check('an owner sees the access-requests view', afterOwner.includes('Access Requests'));

  /* ── 4. the stray zero badge ──────────────────────────────────── */
  const navZeros = await page
    .locator('nav button')
    .evaluateAll((els) => els.filter((e) => /(^|\s)0(\s|$)/.test(e.textContent ?? '')).map((e) => e.textContent));
  check('no sidebar item renders a bare 0', navZeros.length === 0, JSON.stringify(navZeros));

  /* ── 5. every nav entry resolves to a real view ───────────────── */
  console.log('\nEvery module resolves');
  // The business modules landed on the base branch after this work started.
  // Each nav entry must now render its module rather than a placeholder.
  const MODULES = [
    'Projects',
    'BOQ & Quotes',
    'Finance',
    'HR & Training',
    'HSE & Quality',
    'Procurement',
    'Marketing',
    'Reports',
    'Integrations',
    'Users',
    'Audit Logs',
  ];
  for (const label of MODULES) {
    await page.getByRole('button', { name: new RegExp(label.replace(/[&]/g, '\\&')) }).first().click();
    await page.waitForTimeout(220);
    const text = await page.locator('body').innerText();
    check(`${label} renders a real view`, !/is not built yet|coming soon/i.test(text));
  }

  // The users directory must not read as the real access-control surface.
  await page.getByRole('button', { name: /^Users$/ }).first().click();
  await page.waitForTimeout(250);
  const usersText = await page.locator('body').innerText();
  check(
    'the users directory says it is sample people, not sign-in accounts',
    /sample people, not sign-in accounts/i.test(usersText)
  );
  check('it points at where the real accounts are', /Access Requests/.test(usersText));

  /* ── 6. the drawn floor ───────────────────────────────────────── */
  console.log('\nThe virtual office floor');
  await page.getByRole('button', { name: /Virtual Office/ }).click();
  await page.waitForTimeout(700);

  const floor = page.locator('svg.of-floor');
  check('the floor renders', (await floor.count()) === 1);

  const box = await floor.boundingBox();
  check('the floor has real size on the page', !!box && box.width > 600 && box.height > 300,
    box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'no box');

  const label = (await floor.getAttribute('aria-label')) ?? '';
  check('the floor is described for screen readers', label.length > 120);

  const counts = await page.evaluate(() => {
    const svg = document.querySelector('svg.of-floor');
    if (!svg) return null;
    return {
      windows: svg.querySelectorAll('clipPath[id^="of-win-"]').length,
      bubbles: svg.querySelectorAll('.of-say').length,
      sofaSeats: svg.querySelectorAll('.of-sway').length,
      typing: svg.querySelectorAll('.of-type-l, .of-type-r').length,
      tvValues: Array.from(svg.querySelectorAll('.of-tv-value')).map((n) => n.textContent),
      zones: Array.from(svg.querySelectorAll('.of-zone')).map((n) => n.textContent),
      names: Array.from(svg.querySelectorAll('.of-name')).map((n) => n.textContent),
    };
  });
  check('both windows with the view are drawn', counts?.windows === 2, String(counts?.windows));
  check('the sala is labelled', (counts?.zones ?? []).some((z) => /SALA/i.test(z ?? '')));
  check('the shared-table floor is labelled', (counts?.zones ?? []).some((z) => /SHARED TABLES/i.test(z ?? '')));
  check('colleagues are shown talking to each other', (counts?.bubbles ?? 0) >= 4, `${counts?.bubbles} bubbles`);
  check('people are typing at laptops', (counts?.typing ?? 0) >= 2);
  check('the plant in the sala is drawn', (counts?.sofaSeats ?? 0) >= 1);
  check(
    'the screens show live counts, not placeholders',
    (counts?.tvValues ?? []).every((v) => v && v !== '—' && v.trim().length > 0),
    JSON.stringify(counts?.tvValues)
  );
  check(
    'seats carry real agent names from the registry',
    (counts?.names ?? []).length >= 2 && (counts?.names ?? []).every((n) => (n ?? '').includes('&')),
    JSON.stringify(counts?.names)
  );

  await page.screenshot({ path: `${SHOT_DIR}/02-virtual-office.png`, fullPage: true });
  await floor.screenshot({ path: `${SHOT_DIR}/03-floor.png` });

  /* ── 6b. a company creates its own agent ──────────────────────── */
  console.log('\nAgents of your own');
  await page.getByRole('button', { name: /AI Staff/ }).click();
  await page.waitForTimeout(400);

  const staffText = await page.locator('body').innerText();
  check('an owner is offered the agent builder', /Add an agent/i.test(staffText));
  check(
    'the reference roster is described as the shipped set, not as yours',
    /reference set that ships with the build/i.test(staffText)
  );

  await page.getByRole('button', { name: '+ Add an agent' }).click();
  await page.waitForTimeout(300);

  // Refuse an agent with no tools granted.
  await page.locator('#ag-name').fill('VERTEX');
  await page.locator('#ag-title').fill('Rope Access Scheduler');
  await page
    .locator('#ag-desc')
    .fill('Plans the weekly rope-access crews against confirmed job dates and certification expiry.');
  await page.getByRole('button', { name: /Add to / }).click();
  await page.waitForTimeout(300);
  const noToolsMsg = await page.locator('[role=alert]').innerText().catch(() => '');
  check('an agent with no tools granted is refused', /at least one tool/i.test(noToolsMsg), noToolsMsg);

  // Approval level should follow from what is granted.
  const readLevel = await page.locator('text=/Approval level \\d/').first().innerText();
  check('read-only grants sit at approval level 1', /level 1/i.test(readLevel), readLevel);

  await page.getByText('Read projects', { exact: false }).first().click();
  await page.waitForTimeout(200);
  await page.getByText('Write the schedule', { exact: false }).first().click();
  await page.waitForTimeout(250);
  const writeLevel = await page.locator('text=/Approval level \\d/').first().innerText();
  check('granting a write raises the approval level', /level 3/i.test(writeLevel), writeLevel);

  await page.getByRole('button', { name: /Add to / }).click();
  await page.waitForTimeout(600);

  const afterCreate = await page.locator('body').innerText();
  check('the agent is created for the company', /VERTEX was added to/i.test(afterCreate));
  check('it appears in the directory', afterCreate.includes('Rope Access Scheduler'));
  // The badge is uppercased in CSS, so innerText comes back as "YOURS".
  check('it is marked as belonging to this company', /\byours\b/i.test(afterCreate));
  check(
    'a brand new agent shows no success rate rather than 0%',
    /No runs/i.test(afterCreate),
    'a new agent was given a numeric success score'
  );

  const vertexStored = await page.evaluate(() => localStorage.getItem('neas_custom_agents_v1'));
  check('the agent is persisted, not just in component state', (vertexStored ?? '').includes('VERTEX'));
  await page.screenshot({ path: `${SHOT_DIR}/07-agent-builder.png`, fullPage: true });

  /* ── 6c. the email centre stops pretending ────────────────────── */
  console.log('\nEmail Center honesty');
  await page.getByRole('button', { name: /Email Center/ }).click();
  await page.waitForTimeout(500);

  const mailText = await page.locator('body').innerText();
  check('it reports Gmail as not connected', /Gmail not connected/i.test(mailText));
  check('it says the listed messages are sample data', /sample data, not your inbox/i.test(mailText));
  check(
    'it names the missing configuration',
    /VITE_GOOGLE_CLIENT_ID/.test(mailText),
    'the blocker was not named'
  );
  check(
    'it no longer claims a recent sync',
    !/2 minutes ago/i.test(mailText),
    'a fabricated last-sync time is still shown'
  );
  check(
    'it no longer asserts a connected company mailbox',
    !/company\.info\.nextedgeaccesssolutions@gmail\.com/.test(mailText),
    'an unauthorized address is still presented as connected'
  );
  await page.screenshot({ path: `${SHOT_DIR}/08-email-center.png`, fullPage: true });

  /* ── 7. a second person must be approved ──────────────────────── */
  console.log('\nApproval is required for everyone after the owner');
  const joinerCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const joiner = await joinerCtx.newPage();
  // Same origin, separate storage: the joiner shares the company, not the session.
  await joiner.goto(BASE, { waitUntil: 'networkidle' });
  // Seed the company into this context by signing the owner in first, so the
  // joiner is genuinely the second account for that company.
  await joiner.getByRole('button', { name: 'Request Access' }).first().click();
  await joiner.locator('#su-name').fill(OWNER.name);
  await joiner.locator('#su-company').fill(COMPANY);
  await joiner.locator('#su-email').fill(OWNER.email);
  await joiner.locator('#su-password').fill(OWNER.password);
  await joiner.locator('#su-confirm').fill(OWNER.password);
  await joiner.locator('button[type=submit]').click();
  await joiner.waitForTimeout(1000);
  await joiner.getByRole('button', { name: 'Sign out' }).click();
  await joiner.waitForTimeout(400);

  await fillSignup(joiner, JOINER, COMPANY);
  await joiner.waitForTimeout(1200);

  const joinerText = await joiner.locator('body').innerText();
  check('the second account lands on the waiting screen', /Waiting for approval/i.test(joinerText));
  check('no company data is rendered for a pending account',
    !joinerText.includes('Executive Center') && !joinerText.includes('Workforce Control'),
    'the office leaked to a pending account');
  check('the waiting screen names who can approve them', joinerText.includes(OWNER.email));
  await joiner.screenshot({ path: `${SHOT_DIR}/04-pending.png` });

  /* ── 8. the owner approves, explicitly ────────────────────────── */
  console.log('\nThe owner decides');
  await joiner.getByRole('button', { name: 'Sign out' }).click();
  await joiner.waitForTimeout(400);
  await joiner.locator('#login-email').fill(OWNER.email);
  await joiner.locator('#login-password').fill(OWNER.password);
  await joiner.locator('button[type=submit]').click();
  await joiner.waitForTimeout(1200);

  await joiner.getByRole('button', { name: /Access Requests/ }).click();
  await joiner.waitForTimeout(400);
  const queueText = await joiner.locator('body').innerText();
  check('the pending person appears in the owner queue', queueText.includes(JOINER.email));
  check('approving as member and as admin are separate choices',
    /Approve as member/i.test(queueText) && /Approve as admin/i.test(queueText));
  await joiner.screenshot({ path: `${SHOT_DIR}/05-approvals.png` });

  await joiner.getByRole('button', { name: 'Approve as member' }).first().click();
  await joiner.waitForTimeout(500);
  const approvedText = await joiner.locator('body').innerText();
  check('the approval is confirmed back to the owner', /was approved as a member/i.test(approvedText));
  check('the queue empties after deciding', /Nobody is waiting/i.test(approvedText));

  /* ── 9. the approved person now gets in ───────────────────────── */
  console.log('\nThe approved person gets in');
  await joiner.getByRole('button', { name: 'Sign out' }).click();
  await joiner.waitForTimeout(400);
  await joiner.locator('#login-email').fill(JOINER.email);
  await joiner.locator('#login-password').fill(JOINER.password);
  await joiner.locator('button[type=submit]').click();
  await joiner.waitForTimeout(1200);

  const inText = await joiner.locator('body').innerText();
  check('the approved account reaches the office', inText.includes('Executive Center'));
  check('they are no longer waiting', !/Waiting for approval/i.test(inText));
  check('a member does not see the access-requests view', !inText.includes('Access Requests'),
    'a member was shown the admin queue');

  /* ── 10. a wrong password is refused, without disclosure ──────── */
  console.log('\nSign-in failures');
  await joiner.getByRole('button', { name: 'Sign out' }).click();
  await joiner.waitForTimeout(400);
  await joiner.locator('#login-email').fill(JOINER.email);
  await joiner.locator('#login-password').fill('definitely-not-the-password');
  await joiner.locator('button[type=submit]').click();
  await joiner.waitForTimeout(600);
  const wrongMsg = await joiner.locator('[role=alert]').innerText().catch(() => '');
  check('a wrong password is refused', /do not match/i.test(wrongMsg), wrongMsg);

  await joiner.locator('#login-email').fill(`nobody${stamp}@e2e.test`);
  await joiner.locator('#login-password').fill('definitely-not-the-password');
  await joiner.locator('button[type=submit]').click();
  await joiner.waitForTimeout(600);
  const unknownMsg = await joiner.locator('[role=alert]').innerText().catch(() => '');
  check('an unknown address gets the identical message',
    unknownMsg === wrongMsg && unknownMsg.length > 0,
    `"${unknownMsg}" vs "${wrongMsg}"`);

  /* ── 11. no plaintext passwords are left in storage ───────────── */
  console.log('\nStorage hygiene');
  const storage = await joiner.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) out[k] = localStorage.getItem(k);
    }
    return out;
  });
  check('the old plaintext account store is gone', !('neas_accounts' in storage), Object.keys(storage).join(','));
  const dump = JSON.stringify(storage);
  check('no password appears in storage in the clear',
    !dump.includes(OWNER.password) && !dump.includes(JOINER.password));
  check('the stored record keeps a PBKDF2 derivation', /PBKDF2-SHA256/.test(dump));
  check('the session record carries no role', !/"role"\s*:/.test(storage['neas_session_v2'] ?? '{}'));

  /* ── 12. mobile layout ────────────────────────────────────────── */
  console.log('\nNarrow viewport');
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mob = await phone.newPage();
  await mob.goto(BASE, { waitUntil: 'networkidle' });
  const overflow = await mob.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check('the sign-in screen does not scroll sideways on a phone', overflow <= 2, `${overflow}px overflow`);
  await mob.screenshot({ path: `${SHOT_DIR}/06-phone-signin.png` });

  /* ── 13. the console stayed clean ─────────────────────────────── */
  // index.html pulls Google's GAPI/GIS clients and a Font Awesome CDN. A
  // sandboxed CI runner has no egress to those hosts, so their load failures
  // are an environment limit rather than an application fault. Everything
  // else is a real error and fails the run.
  const blockedByEgress = /ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_REFUSED/i;
  const realErrors = consoleErrors.filter(
    (e) => !/favicon|Script error/i.test(e) && !blockedByEgress.test(e)
  );
  check('no console errors during the run', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
  if (consoleErrors.some((e) => blockedByEgress.test(e))) {
    console.log('  note  external scripts (apis.google.com, accounts.google.com, cdnjs) were unreachable from this runner');
  }
} finally {
  await browser.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
