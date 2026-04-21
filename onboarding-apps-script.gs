/**
 * Nelsons Film — Samenwerkingsverklaring intake
 *
 * SETUP
 * -----
 * 1. Create a new Google Sheet. First row headers (column A..K):
 *    Timestamp | Language | First name | Last name | Email | Phone |
 *    On behalf of | Organisation | Org email | Signature type | Full answers (JSON)
 *
 * 2. Extensions → Apps Script. Paste this whole file in (replace the default Code.gs).
 *
 * 3. Edit the CONFIG block below (admin email address).
 *
 * 4. Deploy → New deployment
 *    - Type: Web app
 *    - Description: "Nelsons Film onboarding intake"
 *    - Execute as: Me (your account)
 *    - Who has access: Anyone
 *    → Deploy. You'll be asked to authorize — allow it.
 *    → Copy the "Web app URL" (ends in /exec).
 *
 * 5. In this repo, open `public/onboarding/config.js` and paste the URL as
 *    the value of window.NF_SUBMIT_URL. Commit & push.
 *
 * UPDATING THE SCRIPT
 * -------------------
 * If you edit this script later, hit Deploy → Manage deployments → pick your
 * deployment → pencil icon → "New version" → Deploy. The /exec URL stays the
 * same so you don't need to touch the site.
 */

const CONFIG = {
  ADMIN_EMAIL: 'austinkloske@gmail.com',  // who gets notified on every submission
  SEND_PARTNER_CONFIRMATION: true,         // auto-ack the person who submitted
  SHEET_NAME: 'Submissions',               // samenwerking/collaboration statements
  RSVP_SHEET_NAME: 'RSVPs',                // neighbour RSVPs for individual screenings
  NOTIFY_SHEET_NAME: 'Notify',             // "tell me when you're in my city" signups
  // If this Apps Script is STANDALONE (not created from inside a Sheet), paste the
  // target Sheet's ID here. Find it in the Sheet URL:
  //   https://docs.google.com/spreadsheets/d/{THIS_IS_THE_ID}/edit
  // If the script is bound to a Sheet (Extensions → Apps Script from the Sheet),
  // you can leave this empty.
  SPREADSHEET_ID: '1UWGd7kBt1JSAxVAI10D27wUhIxLkAL4-7vlNKXDk64U',
};

function doPost(e) {
  const t0 = Date.now();
  console.log('[doPost] start', {
    hasPostData: !!(e && e.postData),
    contentLength: e && e.postData ? e.postData.contents.length : 0,
    contentType: e && e.postData ? e.postData.type : null,
  });
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No POST body received');
    }
    const body = JSON.parse(e.postData.contents);

    // RSVP submissions land in their own sheet tab and send NO emails —
    // the email engine migration happens later.
    if (body && body.type === 'rsvp') {
      return handleRsvp(body);
    }

    // "Notify me when you're in my city" signups — also no emails, just
    // rows in the Notify sheet tab grouped by location.
    if (body && body.type === 'notify') {
      return handleNotify(body);
    }

    const { lang = 'nl', answers = {}, signature, submittedAt, userAgent, pageUrl } = body;
    console.log('[doPost] parsed', {
      lang, submittedAt,
      answerKeys: Object.keys(answers),
      hasSignature: !!signature,
      signatureMode: signature?.mode,
    });

    const contact = answers.contact || {};
    const org = answers.orgDetails || {};
    const behalfOf = answers.behalfOf === 'org' ? 'Organisation' : 'Individual';

    // 1) Append row to Sheet
    const ss = CONFIG.SPREADSHEET_ID
      ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('No spreadsheet available. Set CONFIG.SPREADSHEET_ID or bind the script to a Sheet via Extensions → Apps Script.');
    console.log('[doPost] spreadsheet', { name: ss.getName(), id: ss.getId(), url: ss.getUrl() });
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      console.log('[doPost] creating sheet tab', CONFIG.SHEET_NAME);
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    }
    sheet.appendRow([
      new Date(submittedAt || Date.now()),
      lang,
      contact.firstName || '',
      contact.lastName || '',
      contact.email || '',
      contact.phone || '',
      behalfOf,
      org.orgName || '',
      org.orgEmail || '',
      signature?.mode || '',
      JSON.stringify(answers),
    ]);
    console.log('[doPost] row appended', { sheet: sheet.getName(), rows: sheet.getLastRow() });

    // 2) Admin email with a readable summary
    const partnerName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || '(no name)';
    const orgLabel = org.orgName ? ` — ${org.orgName}` : '';
    const subject = `Nieuwe samenwerkingsverklaring: ${partnerName}${orgLabel}`;
    const htmlBody = buildAdminHtml(answers, signature, lang, { submittedAt, userAgent, pageUrl });
    const attachments = [];
    if (signature?.mode === 'draw' && signature.data && signature.data.startsWith('data:image/')) {
      attachments.push(dataUrlToBlob(signature.data, 'signature.png'));
    }
    const quotaBefore = MailApp.getRemainingDailyQuota();
    console.log('[doPost] sending admin email', { to: CONFIG.ADMIN_EMAIL, attachments: attachments.length, quotaBefore });
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject,
      htmlBody,
      attachments,
      replyTo: contact.email || CONFIG.ADMIN_EMAIL,
    });
    console.log('[doPost] admin email sent');

    // 3) Optional: confirmation to the partner
    if (CONFIG.SEND_PARTNER_CONFIRMATION && contact.email) {
      const thanksSubject = lang === 'en'
        ? 'Thank you — your collaboration statement was received'
        : 'Bedankt — je samenwerkingsverklaring is ontvangen';
      console.log('[doPost] sending partner confirmation', { to: contact.email });
      MailApp.sendEmail({
        to: contact.email,
        subject: thanksSubject,
        htmlBody: buildPartnerHtml(lang, partnerName),
        replyTo: CONFIG.ADMIN_EMAIL,
      });
      console.log('[doPost] partner confirmation sent');
    } else {
      console.log('[doPost] skipping partner confirmation', { configured: CONFIG.SEND_PARTNER_CONFIRMATION, hasEmail: !!contact.email });
    }

    console.log('[doPost] done', { ms: Date.now() - t0 });
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('[doPost] FAILED', { message: err.message, stack: err.stack, ms: Date.now() - t0 });
    return jsonResponse({ ok: false, error: String(err && err.message || err) });
  }
}

// RSVP handler — appends one row to the RSVPs tab. Does NOT send any email
// (the project doesn't have an email engine wired up yet; once it does,
// add MailApp calls here).
function handleRsvp(body) {
  const t0 = Date.now();
  try {
    console.log('[rsvp] received', {
      movieId: body.movieId, movieTitle: body.movieTitle,
      locale: body.locale, partySize: body.partySize,
      hasNotes: !!(body.notes && String(body.notes).trim()),
    });
    const ss = CONFIG.SPREADSHEET_ID
      ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('No spreadsheet available.');
    let sheet = ss.getSheetByName(CONFIG.RSVP_SHEET_NAME);
    if (!sheet) {
      console.log('[rsvp] creating sheet tab', CONFIG.RSVP_SHEET_NAME);
      sheet = ss.insertSheet(CONFIG.RSVP_SHEET_NAME);
      sheet.appendRow([
        'Timestamp', 'Movie', 'Screening date', 'Email', 'Party size',
        'Notes', 'Locale', 'Referrer', 'Page URL',
      ]);
    }
    sheet.appendRow([
      new Date(body.submittedAt || Date.now()),
      body.movieTitle || '',
      body.screeningDate || '',
      body.email || '',
      Number(body.partySize || 0),
      body.notes || '',
      body.locale || '',
      body.referrer || '',
      body.pageUrl || '',
    ]);
    console.log('[rsvp] row appended', { rows: sheet.getLastRow(), ms: Date.now() - t0 });
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('[rsvp] FAILED', { message: err.message, stack: err.stack });
    return jsonResponse({ ok: false, error: String(err && err.message || err) });
  }
}

// Notify handler — appends one row to the Notify tab. No emails. Same
// no-PII-beyond-necessary philosophy as handleRsvp.
function handleNotify(body) {
  const t0 = Date.now();
  try {
    console.log('[notify] received', { location: body.location, locale: body.locale });
    const ss = CONFIG.SPREADSHEET_ID
      ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('No spreadsheet available.');
    let sheet = ss.getSheetByName(CONFIG.NOTIFY_SHEET_NAME);
    if (!sheet) {
      console.log('[notify] creating sheet tab', CONFIG.NOTIFY_SHEET_NAME);
      sheet = ss.insertSheet(CONFIG.NOTIFY_SHEET_NAME);
      sheet.appendRow(['Timestamp', 'Location', 'Email', 'Locale', 'Referrer', 'Page URL']);
    }
    sheet.appendRow([
      new Date(body.submittedAt || Date.now()),
      body.location || '',
      body.email || '',
      body.locale || '',
      body.referrer || '',
      body.pageUrl || '',
    ]);
    console.log('[notify] row appended', { rows: sheet.getLastRow(), ms: Date.now() - t0 });
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('[notify] FAILED', { message: err.message, stack: err.stack });
    return jsonResponse({ ok: false, error: String(err && err.message || err) });
  }
}

// Optional: GET returns a health check so you can sanity-test the URL in a browser.
function doGet() {
  console.log('[doGet] health check');
  return jsonResponse({ ok: true, service: 'nelsons-film-onboarding', time: new Date().toISOString() });
}

/**
 * Run this manually from the Apps Script editor (select `debugTest` in the
 * function dropdown, click Run) to verify Sheet + email without going through
 * the frontend. Check the Execution log for step-by-step output.
 */
function debugTest() {
  const fakeBody = {
    lang: 'nl',
    submittedAt: new Date().toISOString(),
    userAgent: 'debugTest',
    pageUrl: 'debug://local',
    answers: {
      contact: { firstName: 'Debug', lastName: 'User', email: CONFIG.ADMIN_EMAIL, phone: '' },
      behalfOf: 'self',
      contributions: ['A'],
      permission: 'both',
      motivation: 'This is a manual debug test submission to verify the pipeline end-to-end.',
      need: 'dk',
      reach: 'dk',
    },
    signature: { mode: 'type', data: 'Debug User' },
  };
  const result = doPost({ postData: { contents: JSON.stringify(fakeBody), type: 'text/plain' } });
  console.log('[debugTest] result', result.getContent());
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function dataUrlToBlob(dataUrl, filename) {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(5, comma); // e.g. "image/png;base64"
  const mime = meta.split(';')[0];
  const bytes = Utilities.base64Decode(dataUrl.slice(comma + 1));
  return Utilities.newBlob(bytes, mime, filename);
}

// ---- HTML builders ----

function buildAdminHtml(answers, signature, lang, meta) {
  const sections = getSections(lang);
  const questions = getQuestions();  // defined at bottom; mirrors the site's questions.js
  const visible = questions.filter(q => !q.deps || q.deps(answers));

  const grouped = {};
  visible.forEach(q => { (grouped[q.section] = grouped[q.section] || []).push(q); });

  const sectionHtml = Object.keys(grouped).map(sid => {
    const rows = grouped[sid].map(q => {
      const val = renderAnswerHtml(q, answers[q.id], lang);
      if (!val) return '';
      return `
        <tr>
          <td style="padding:8px 12px;border-top:1px solid #e5dfd3;color:#6b5e4a;font-size:12px;width:40%;vertical-align:top;">${escapeHtml(q[lang].title)}</td>
          <td style="padding:8px 12px;border-top:1px solid #e5dfd3;color:#1B2F4A;font-size:14px;">${val}</td>
        </tr>`;
    }).join('');
    if (!rows.trim()) return '';
    return `
      <h3 style="font-family:Georgia,serif;color:#D76E4D;margin:20px 0 4px;">${escapeHtml(sections[Number(sid) - 1] || 'Section ' + sid)}</h3>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>`;
  }).join('');

  const metaLine = meta.submittedAt
    ? `<p style="color:#6b5e4a;font-size:12px;">Submitted ${escapeHtml(meta.submittedAt)} · <a href="${escapeHtml(meta.pageUrl || '')}">${escapeHtml(meta.pageUrl || '')}</a></p>`
    : '';

  const sigBlock = signature?.mode === 'type' && signature.data
    ? `<p style="font-family:cursive;font-size:24px;color:#1B2F4A;margin-top:6px;">${escapeHtml(signature.data)}</p>`
    : signature?.mode === 'draw' && signature.data
      ? `<p style="color:#6b5e4a;font-size:12px;">Handwritten signature is attached as signature.png.</p>`
      : '';

  return `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;background:#f7f1e7;padding:32px;color:#1B2F4A;">
      <div style="font-family:Georgia,serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6b5e4a;">Nelsons Film · Samenwerkingsverklaring</div>
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:6px 0 4px;">Nieuwe intake ontvangen</h1>
      ${metaLine}
      ${sectionHtml}
      <h3 style="font-family:Georgia,serif;color:#D76E4D;margin:24px 0 4px;">Handtekening</h3>
      ${sigBlock}
    </div>`;
}

function buildPartnerHtml(lang, partnerName) {
  const body = lang === 'en'
    ? `
      <p>Hi ${escapeHtml(partnerName)},</p>
      <p>Thank you for submitting your collaboration statement. We have received your answers and will review them shortly.</p>
      <p>Within 5 business days we'll send you a draft statement by email. Once it checks out, you'll sign the formal version.</p>
      <p>— The Nelsons Film team</p>`
    : `
      <p>Hoi ${escapeHtml(partnerName)},</p>
      <p>Bedankt voor het insturen van je samenwerkingsverklaring. We hebben je antwoorden ontvangen en bekijken ze binnenkort.</p>
      <p>Binnen 5 werkdagen sturen we je een concept per e-mail. Klopt alles, dan onderteken je formeel.</p>
      <p>— Het team van Nelsons Film</p>`;
  return `<div style="font-family:Arial,sans-serif;max-width:560px;color:#1B2F4A;line-height:1.6;">${body}</div>`;
}

function renderAnswerHtml(q, ans, lang) {
  if (ans == null || ans === '' || (Array.isArray(ans) && !ans.length)) return '';
  const L = q[lang];
  if (q.kind === 'text-group') {
    const rows = L.fields
      .map(f => ans[f.key] ? `<div><strong style="color:#6b5e4a;">${escapeHtml(f.label)}:</strong> ${escapeHtml(ans[f.key])}</div>` : '')
      .filter(Boolean).join('');
    return rows;
  }
  if (q.kind === 'single' || q.kind === 'single-text') {
    const v = typeof ans === 'object' ? ans.value : ans;
    const opt = (L.options || []).find(o => o.value === v);
    const base = opt?.label || String(v);
    const extra = typeof ans === 'object' && ans.text ? ` — <em>"${escapeHtml(ans.text)}"</em>` : '';
    return escapeHtml(base) + extra;
  }
  if (q.kind === 'multi') {
    const arr = Array.isArray(ans) ? ans : (ans.values || []);
    const others = ans.others || {};
    return '<ul style="margin:0;padding-left:18px;">' + arr.map(v => {
      const o = (L.options || []).find(o => o.value === v);
      const lbl = o ? o.label : v;
      const note = others[v] ? ` — <em>"${escapeHtml(others[v])}"</em>` : '';
      return `<li>${escapeHtml(lbl)}${note}</li>`;
    }).join('') + '</ul>';
  }
  if (q.kind === 'multi-cards') {
    return '<ul style="margin:0;padding-left:18px;">' + ans.map(v => {
      const o = (L.options || []).find(o => o.value === v);
      return `<li>${escapeHtml(o ? o.label : v)}</li>`;
    }).join('') + '</ul>';
  }
  if (q.kind === 'long') {
    return `<blockquote style="border-left:3px solid #D76E4D;margin:4px 0;padding:4px 12px;background:rgba(215,110,77,0.05);font-style:italic;">${escapeHtml(String(ans))}</blockquote>`;
  }
  if (q.kind === 'euro') {
    const n = Number(ans);
    if (!n) return '';
    const unit = lang === 'en' ? 'per screening' : 'per editie';
    return `€ ${n.toLocaleString()} <span style="color:#6b5e4a;font-size:12px;">${unit}</span>`;
  }
  return escapeHtml(String(ans));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ---- Question metadata (kept in sync with public/onboarding/questions.js) ----
function getSections(lang) {
  return lang === 'en'
    ? ['Personal details', 'Organisation', 'Your contribution', 'Follow-ups', 'Name & logo', 'Motivation', 'Pre-programme', 'Sign']
    : ['Persoonsgegevens', 'Organisatie', 'Jouw bijdrage', 'Verdieping', 'Naam & logo', 'Motivatie', 'Voorprogramma', 'Ondertekenen'];
}

function getQuestions() {
  // Minimal mirror: id, section, kind, deps, and per-lang title + options/fields.
  // If you add/change a question in public/onboarding/questions.js, update it here too.
  return [
    { id: 'contact', section: 1, kind: 'text-group',
      nl: { title: 'Vertel ons wie je bent', fields: [
        { key: 'firstName', label: 'Voornaam' }, { key: 'lastName', label: 'Achternaam' },
        { key: 'phone', label: 'Telefoonnummer' }, { key: 'email', label: 'E-mailadres' } ]},
      en: { title: 'Tell us who you are', fields: [
        { key: 'firstName', label: 'First name' }, { key: 'lastName', label: 'Last name' },
        { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email address' } ]}},
    { id: 'behalfOf', section: 1, kind: 'single',
      nl: { title: 'Ik vul dit formulier in namens:', options: [
        { value: 'self', label: 'Mijzelf' }, { value: 'org', label: 'Mijn organisatie' } ]},
      en: { title: 'I am completing this form on behalf of:', options: [
        { value: 'self', label: 'Myself' }, { value: 'org', label: 'My organisation' } ]}},
    { id: 'orgDetails', section: 2, kind: 'text-group', deps: a => a.behalfOf === 'org',
      nl: { title: 'Gegevens van jouw organisatie', fields: [
        { key: 'orgName', label: 'Naam organisatie' }, { key: 'orgRole', label: 'Jouw functie en rol' },
        { key: 'orgEmail', label: 'E-mail organisatie' }, { key: 'orgPhone', label: 'Telefoon organisatie' },
        { key: 'orgAddress', label: 'Adres organisatie' } ]},
      en: { title: 'Details of your organisation', fields: [
        { key: 'orgName', label: 'Organisation name' }, { key: 'orgRole', label: 'Your role' },
        { key: 'orgEmail', label: 'Organisation email' }, { key: 'orgPhone', label: 'Organisation phone' },
        { key: 'orgAddress', label: 'Organisation address' } ]}},
    { id: 'orgType', section: 2, kind: 'single', deps: a => a.behalfOf === 'org',
      nl: { title: 'Welk type organisatie vertegenwoordig jij?', options: [
        { value: 'buurthuis', label: 'Buurthuis of wijkcentrum' }, { value: 'cultureel', label: 'Culturele broedplaats' },
        { value: 'azc', label: 'AZC of COA' }, { value: 'welzijn', label: 'Welzijnsorganisatie' },
        { value: 'woning', label: 'Woningbouwcorporatie' }, { value: 'bib', label: 'Bibliotheek' },
        { value: 'religie', label: 'Kerk of moskee' }, { value: 'zorg', label: 'Gezondheidscentrum' },
        { value: 'mkb', label: 'Lokaal MKB' }, { value: 'bewoners', label: 'Bewonersvereniging' },
        { value: 'gemeente', label: 'Gemeente (afdeling)' }, { value: 'school', label: 'School of onderwijs' },
        { value: 'other', label: 'Anders' } ]},
      en: { title: 'What type of organisation do you represent?', options: [
        { value: 'buurthuis', label: 'Community centre' }, { value: 'cultureel', label: 'Cultural incubator' },
        { value: 'azc', label: 'Asylum centre (AZC/COA)' }, { value: 'welzijn', label: 'Welfare organisation' },
        { value: 'woning', label: 'Housing association' }, { value: 'bib', label: 'Library' },
        { value: 'religie', label: 'Church or mosque' }, { value: 'zorg', label: 'Health centre' },
        { value: 'mkb', label: 'Local SME' }, { value: 'bewoners', label: "Residents' association" },
        { value: 'gemeente', label: 'Municipality (department)' }, { value: 'school', label: 'School or education' },
        { value: 'other', label: 'Other' } ]}},
    { id: 'orgReach', section: 2, kind: 'single', deps: a => a.behalfOf === 'org',
      nl: { title: 'Hoeveel mensen bereikt jouw organisatie actief per maand?', options: [
        { value: '<50', label: 'Minder dan 50' }, { value: '50-200', label: '50 tot 200' },
        { value: '200-500', label: '200 tot 500' }, { value: '500+', label: 'Meer dan 500' },
        { value: 'dk', label: 'Weet ik niet' } ]},
      en: { title: 'How many people does your organisation actively reach per month?', options: [
        { value: '<50', label: 'Fewer than 50' }, { value: '50-200', label: '50 to 200' },
        { value: '200-500', label: '200 to 500' }, { value: '500+', label: 'More than 500' },
        { value: 'dk', label: "I don't know" } ]}},
    { id: 'orgAudience', section: 2, kind: 'multi', deps: a => a.behalfOf === 'org',
      nl: { title: 'Welke doelgroepen bereikt jouw organisatie?', options: [
        { value: 'newcomers', label: 'Nieuwkomers en statushouders' }, { value: 'diverse', label: 'Diverse culturele achtergrond' },
        { value: 'elderly', label: 'Ouderen' }, { value: 'youth', label: 'Jongeren en kinderen' },
        { value: 'language', label: 'Beperkte kennis van het Nederlands' }, { value: 'mixed', label: 'Gemengd publiek' },
        { value: 'other', label: 'Anders' } ]},
      en: { title: 'Which target groups does your organisation reach?', options: [
        { value: 'newcomers', label: 'Newcomers and status holders' }, { value: 'diverse', label: 'Diverse cultural backgrounds' },
        { value: 'elderly', label: 'Older adults' }, { value: 'youth', label: 'Young people and children' },
        { value: 'language', label: 'Limited Dutch proficiency' }, { value: 'mixed', label: 'Mixed general public' },
        { value: 'other', label: 'Other' } ]}},
    { id: 'orgPast', section: 2, kind: 'single-text', deps: a => a.behalfOf === 'org',
      nl: { title: 'Heeft jouw organisatie eerder meegedaan aan een wijkinitiatief?', options: [
        { value: 'yes', label: 'Ja' }, { value: 'no', label: 'Nee' } ]},
      en: { title: 'Has your organisation taken part in a neighbourhood initiative before?', options: [
        { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' } ]}},
    { id: 'contributions', section: 3, kind: 'multi-cards',
      nl: { title: 'Hoe kun jij bijdragen?', options: [
        { value: 'A', label: 'Lokale ambassadeur' }, { value: 'B', label: 'Opbouw en afbouw' },
        { value: 'C', label: 'Digitale promotie' }, { value: 'D', label: 'Fysieke promotie' },
        { value: 'E', label: 'Locatie' }, { value: 'F', label: 'Financiële bijdrage' },
        { value: 'G', label: 'Fysieke sponsoring' }, { value: 'H', label: 'Iets anders' } ]},
      en: { title: 'How can you contribute?', options: [
        { value: 'A', label: 'Local ambassador' }, { value: 'B', label: 'Set up & pack down' },
        { value: 'C', label: 'Digital promotion' }, { value: 'D', label: 'Physical promotion' },
        { value: 'E', label: 'Venue' }, { value: 'F', label: 'Financial contribution' },
        { value: 'G', label: 'Physical sponsorship' }, { value: 'H', label: 'Something else' } ]}},
    { id: 'f_ambassador', section: 4, kind: 'single', deps: a => (a.contributions || []).includes('A'),
      nl: { title: 'Lokale ambassadeur', options: [
        { value: 'self', label: 'Ik doe het zelf' }, { value: 'refer', label: 'Ik draag iemand anders voor' },
        { value: 'info', label: 'Ik wil eerst meer informatie' } ]},
      en: { title: 'Local ambassador', options: [
        { value: 'self', label: 'I do it myself' }, { value: 'refer', label: 'I refer someone else' },
        { value: 'info', label: "I'd like more info first" } ]}},
    { id: 'f_buildcrew', section: 4, kind: 'single', deps: a => (a.contributions || []).includes('B'),
      nl: { title: 'Opbouw en afbouw', options: [
        { value: '1', label: '1 persoon (ikzelf)' }, { value: '2', label: '2 personen (minimum)' },
        { value: '3', label: '3 personen' }, { value: '4+', label: '4 of meer (ideaal)' } ]},
      en: { title: 'Set up and pack down', options: [
        { value: '1', label: '1 person (myself)' }, { value: '2', label: '2 people (minimum)' },
        { value: '3', label: '3 people' }, { value: '4+', label: '4 or more (ideal)' } ]}},
    { id: 'f_digital', section: 4, kind: 'multi', deps: a => (a.contributions || []).includes('C'),
      nl: { title: 'Digitale promotie — welke kanalen?', options: [
        { value: 'ig', label: 'Instagram' }, { value: 'fb', label: 'Facebook' }, { value: 'tt', label: 'TikTok' },
        { value: 'nl', label: 'Website / nieuwsbrief' }, { value: 'wa', label: 'WhatsApp-groepen in de wijk' },
        { value: 'li', label: 'LinkedIn' }, { value: 'other', label: 'Anders' } ]},
      en: { title: 'Digital promotion — which channels?', options: [
        { value: 'ig', label: 'Instagram' }, { value: 'fb', label: 'Facebook' }, { value: 'tt', label: 'TikTok' },
        { value: 'nl', label: 'Website / newsletter' }, { value: 'wa', label: 'Neighbourhood WhatsApp groups' },
        { value: 'li', label: 'LinkedIn' }, { value: 'other', label: 'Other' } ]}},
    { id: 'f_physical', section: 4, kind: 'multi', deps: a => (a.contributions || []).includes('D'),
      nl: { title: 'Fysieke promotie', options: [
        { value: 'print', label: 'Ik kan drukwerk kostenloos regelen' }, { value: 'distribute', label: 'Ik verspreid op ~25 vaste plekken' },
        { value: 'flyer', label: 'Ik ga flyeren in de wijk' }, { value: 'other', label: 'Andere vorm' } ]},
      en: { title: 'Physical promotion', options: [
        { value: 'print', label: 'I can arrange printing for free' }, { value: 'distribute', label: 'I distribute at ~25 fixed spots' },
        { value: 'flyer', label: 'I hand out flyers' }, { value: 'other', label: 'Another form' } ]}},
    { id: 'f_venue', section: 4, kind: 'single', deps: a => (a.contributions || []).includes('E'),
      nl: { title: 'Locatie', options: [
        { value: 'suggest', label: 'Ik heb een locatiesuggestie' }, { value: 'offer', label: 'Ik kan zelf een locatie aanbieden' } ]},
      en: { title: 'Venue', options: [
        { value: 'suggest', label: 'I have a venue suggestion' }, { value: 'offer', label: 'I can offer a venue myself' } ]}},
    { id: 'f_financial', section: 4, kind: 'euro', deps: a => (a.contributions || []).includes('F'),
      nl: { title: 'Financiële bijdrage' }, en: { title: 'Financial contribution' }},
    { id: 'f_sponsor', section: 4, kind: 'long', deps: a => (a.contributions || []).includes('G'),
      nl: { title: 'Fysieke sponsoring' }, en: { title: 'Physical sponsorship' }},
    { id: 'f_other', section: 4, kind: 'long', deps: a => (a.contributions || []).includes('H'),
      nl: { title: 'Een andere bijdrage' }, en: { title: 'Another form of contribution' }},
    { id: 'permission', section: 5, kind: 'single',
      nl: { title: 'Mogen we jouw naam en logo gebruiken?', options: [
        { value: 'both', label: 'Ja, naam én logo' }, { value: 'name', label: 'Ja, alleen naam' }, { value: 'no', label: 'Nee' } ]},
      en: { title: 'May we use your name and logo?', options: [
        { value: 'both', label: 'Yes, name and logo' }, { value: 'name', label: 'Yes, name only' }, { value: 'no', label: 'No' } ]}},
    { id: 'motivation', section: 6, kind: 'long',
      nl: { title: 'Waarom steun jij Nelsons Film?' }, en: { title: 'Why do you support Nelsons Film?' }},
    { id: 'need', section: 6, kind: 'single-text',
      nl: { title: 'Is er behoefte aan een verbindend wijkprogramma?', options: [
        { value: 'yes', label: 'Ja' }, { value: 'no', label: 'Nee' }, { value: 'dk', label: 'Ik weet het niet' } ]},
      en: { title: 'Is there a need for a connecting neighbourhood programme?', options: [
        { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'dk', label: 'Not sure' } ]}},
    { id: 'hardToReach', section: 6, kind: 'multi', deps: a => a.need === 'yes',
      nl: { title: 'Welke groepen worden moeilijk bereikt door bestaande initiatieven?', options: [
        { value: 'newcomers', label: 'Nieuwkomers en statushouders' }, { value: 'diverse', label: 'Diverse culturele achtergrond' },
        { value: 'isolated', label: 'Sociaal geïsoleerde ouderen' }, { value: 'youth', label: 'Jongeren zonder ontmoetingsplek' },
        { value: 'language', label: 'Mensen die NL nog niet beheersen' }, { value: 'dk', label: 'Weet ik niet' },
        { value: 'other', label: 'Anders' } ]},
      en: { title: 'Which groups are hard to reach by existing initiatives?', options: [
        { value: 'newcomers', label: 'Newcomers and status holders' }, { value: 'diverse', label: 'Diverse cultural backgrounds' },
        { value: 'isolated', label: 'Socially isolated older adults' }, { value: 'youth', label: 'Young people without a meeting place' },
        { value: 'language', label: 'Limited Dutch proficiency' }, { value: 'dk', label: "I don't know" },
        { value: 'other', label: 'Other' } ]}},
    { id: 'languages', section: 6, kind: 'multi', deps: a => a.need === 'yes',
      nl: { title: 'Welke talen worden naast Nederlands veel gesproken?', options: [
        { value: 'ar', label: 'Arabisch' }, { value: 'tr', label: 'Turks' }, { value: 'pl', label: 'Pools' },
        { value: 'ti', label: 'Tigrinya' }, { value: 'fa', label: 'Dari / Farsi' }, { value: 'so', label: 'Somalisch' },
        { value: 'dk', label: 'Weet ik niet' }, { value: 'other', label: 'Andere taal' } ]},
      en: { title: 'Which languages are widely spoken besides Dutch?', options: [
        { value: 'ar', label: 'Arabic' }, { value: 'tr', label: 'Turkish' }, { value: 'pl', label: 'Polish' },
        { value: 'ti', label: 'Tigrinya' }, { value: 'fa', label: 'Dari / Farsi' }, { value: 'so', label: 'Somali' },
        { value: 'dk', label: 'Not sure' }, { value: 'other', label: 'Another language' } ]}},
    { id: 'reach', section: 6, kind: 'single',
      nl: { title: 'Hoeveel unieke bewoners verwacht je te bereiken via jouw netwerk?', options: [
        { value: '<25', label: 'Minder dan 25' }, { value: '25-75', label: '25 tot 75' },
        { value: '75-150', label: '75 tot 150' }, { value: '150+', label: 'Meer dan 150' },
        { value: 'dk', label: 'Weet ik niet' } ]},
      en: { title: 'How many unique residents do you expect to reach through your network?', options: [
        { value: '<25', label: 'Fewer than 25' }, { value: '25-75', label: '25 to 75' },
        { value: '75-150', label: '75 to 150' }, { value: '150+', label: 'More than 150' },
        { value: 'dk', label: 'Not sure' } ]}},
    { id: 'similar', section: 6, kind: 'long',
      nl: { title: 'Bestaande vergelijkbare initiatieven in de wijk?' },
      en: { title: 'Any comparable initiatives in your neighbourhood?' }},
    { id: 'preshow', section: 7, kind: 'single-text',
      nl: { title: 'Suggestie voor het voorprogramma?', options: [
        { value: 'yes', label: 'Ja, ik heb een suggestie' }, { value: 'no', label: 'Nee, silent disco is prima' } ]},
      en: { title: 'Pre-programme suggestion?', options: [
        { value: 'yes', label: 'Yes, I have a suggestion' }, { value: 'no', label: 'No, silent disco is fine' } ]}},
    { id: 'remarks', section: 7, kind: 'long',
      nl: { title: 'Aanvullende opmerkingen of ideeën?' },
      en: { title: 'Additional comments or ideas?' }},
  ];
}
