// Main App — orchestrates landing, question flow, review, confirmation
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

const STORAGE_KEY = 'nf_onboarding_v1';

// Initial language. Preference order:
// 1. ?lang= query param (set by locale redirects from /en/samenwerking etc.)
// 2. URL path segment (defensive; the canonical route is bare /samenwerking)
// 3. Default 'nl'
// The form only supports 'nl' and 'en'; any other value falls back to 'nl'.
function detectLang() {
  try {
    const qp = new URLSearchParams(window.location.search).get('lang');
    if (qp === 'en' || qp === 'nl') {
      // Strip the query param so the canonical URL is clean.
      const url = new URL(window.location.href);
      url.searchParams.delete('lang');
      window.history.replaceState({}, '', url.pathname + (url.search || '') + url.hash);
      return qp;
    }
  } catch (e) { /* ignore */ }
  const seg = window.location.pathname.split('/').filter(Boolean)[0];
  if (seg === 'en') return 'en';
  return 'nl';
}

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { return null; }
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function visibleQuestions(answers) {
  return window.QUESTIONS.filter(q => !q.deps || q.deps(answers));
}

function App() {
  const saved = uM(() => loadSaved(), []);
  // URL-derived lang always wins on initial load — the user's last click on
  // the site-wide language picker put them on this specific /samenwerking
  // route, so respect it. They can still toggle in-page afterwards.
  const [lang, setLang] = uS(detectLang());
  const [phase, setPhase] = uS(saved ? 'resume' : 'landing');
  const [answers, setAnswers] = uS(saved?.answers || {});
  const [index, setIndex] = uS(saved?.index || 0);
  const [err, setErr] = uS(null);
  const [signature, setSignature] = uS(saved?.signature || null);
  const [agreed, setAgreed] = uS(false);
  const [showPdf, setShowPdf] = uS(false);
  const [submitting, setSubmitting] = uS(false);
  const [submitErr, setSubmitErr] = uS(null);

  const qs = uM(() => visibleQuestions(answers), [answers]);
  const current = qs[index];

  uE(() => { saveState({ lang, answers, index, signature }); }, [lang, answers, index, signature]);

  const setAns = (id, v) => setAnswers(a => ({ ...a, [id]: v }));

  const startFlow = () => {
    if (!answers.__committed) setAnswers(a => ({ ...a, __committed: true }));
    setPhase('flow');
    setIndex(0);
  };

  const resumeFromSaved = () => {
    const newQs = visibleQuestions(answers);
    for (let i = 0; i < newQs.length; i++) {
      const res = window.validateQuestion(newQs[i], answers, lang);
      if (!res.ok) { setIndex(i); setPhase('flow'); return; }
    }
    // All visible questions pass validation → send them to review
    setIndex(Math.max(0, newQs.length - 1));
    setPhase('review');
  };

  const next = () => {
    if (!current) return;
    const res = window.validateQuestion(current, answers, lang);
    if (!res.ok) { setErr(res.msg); return; }
    setErr(null);
    const newQs = visibleQuestions(answers);
    if (index + 1 >= newQs.length) { setPhase('review'); return; }
    setIndex(index + 1);
  };
  const back = () => {
    setErr(null);
    if (index === 0) { setPhase('landing'); return; }
    setIndex(index - 1);
  };
  const gotoQuestion = (qid) => {
    const newQs = visibleQuestions(answers);
    const idx = newQs.findIndex(q => q.id === qid);
    if (idx >= 0) { setIndex(idx); setPhase('flow'); }
  };

  const gotoSection = (sectionId) => {
    setErr(null);
    if (sectionId === 8) { setPhase('review'); return; }
    const newQs = visibleQuestions(answers);
    const idx = newQs.findIndex(q => q.section === sectionId);
    if (idx < 0) return; // section not currently visible (e.g. Organisation when behalfOf='self')
    setIndex(idx);
    setPhase('flow');
  };

  const submit = async () => {
    if (!agreed || !signature?.data || submitting) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const url = window.NF_SUBMIT_URL;
      if (!url || /PASTE|YOUR_/.test(url)) {
        throw new Error('Submit endpoint not configured');
      }
      const payload = {
        lang,
        answers,
        signature,
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        pageUrl: window.location.href,
      };
      // text/plain avoids a CORS preflight that Apps Script doesn't answer.
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json().catch(() => ({}));
      if (data && data.ok === false) throw new Error(data.error || 'Server rejected submission');
      localStorage.removeItem(STORAGE_KEY);
      setPhase('confirmed');
    } catch (e) {
      console.error('Submit failed', e);
      setSubmitErr(e.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const pct = phase === 'flow' ? Math.round((index / qs.length) * 100)
            : phase === 'review' ? 95 : phase === 'confirmed' ? 100 : 0;

  const discardDraft = () => {
    const msg = lang === 'nl'
      ? 'Weet je zeker dat je opnieuw wilt beginnen? Je ingevulde antwoorden worden gewist.'
      : 'Are you sure you want to start over? Your saved answers will be cleared.';
    if (!window.confirm(msg)) return;
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({}); setIndex(0); setSignature(null); setAgreed(false);
    setErr(null); setSubmitErr(null);
    setPhase('landing');
  };

  return (
    <>
      <Header lang={lang} setLang={setLang}
        onDiscard={phase !== 'landing' && phase !== 'confirmed' ? discardDraft : null} />

      {phase !== 'landing' && phase !== 'confirmed' && (
        <ProgressRail qs={qs} answers={answers} current={current} pct={pct}
          lang={lang} phase={phase} onSectionClick={gotoSection} />
      )}

      {phase === 'landing' && (
        <Landing lang={lang} onCommit={startFlow} hasSaved={false} />
      )}

      {phase === 'resume' && (
        <Landing lang={lang} hasSaved onCommit={resumeFromSaved}
          onDiscard={discardDraft} />
      )}

      {phase === 'flow' && current && (
        <QuestionScreen key={current.id + index} q={current} answers={answers} setAns={setAns}
          next={next} back={back} err={err} lang={lang}
          index={index} total={qs.length} />
      )}

      {phase === 'review' && (
        <ReviewScreen answers={answers} lang={lang} back={() => { setPhase('flow'); setIndex(qs.length - 1); }}
          onEdit={gotoQuestion}
          signature={signature} setSignature={setSignature}
          agreed={agreed} setAgreed={setAgreed}
          onSubmit={submit} submitting={submitting} submitErr={submitErr}
          onPreviewPdf={() => setShowPdf(true)} />
      )}

      {phase === 'confirmed' && (
        <Confirmation lang={lang} answers={answers} signature={signature} onPreviewPdf={() => setShowPdf(true)} />
      )}

      {showPdf && (
        <PdfPreview answers={answers} signature={signature} lang={lang} onClose={() => setShowPdf(false)} />
      )}
    </>
  );
}

function Header({ lang, setLang, onDiscard }) {
  const L = window.I18N[lang];
  const siteHome = lang === 'en' ? '/en/' : lang === 'ara' ? '/ara/' : '/';
  const startOverLabel = lang === 'nl' ? 'Opnieuw beginnen' : 'Start over';
  return (
    <header className="om-header">
      <div className="om-header-inner">
        <a className="om-brand" href={siteHome}>
          <img src="/images/brand/icon-logo-clear-background.png" alt="Nelsons Film" className="om-brand-logo" />
          <div>
            <div className="om-brand-name">Nelsons Film</div>
          </div>
          <span className="om-brand-tag">{L.brandTag}</span>
        </a>
        <div className="om-header-right">
          <a className="om-back-link" href={siteHome}>← {L.backHome}</a>
          {onDiscard && (
            <button className="om-discard" onClick={onDiscard} title={startOverLabel}>
              {startOverLabel}
            </button>
          )}
          <div className="om-lang-toggle" role="group" aria-label="Language">
            <button
              className={`om-lang-opt ${lang === 'nl' ? 'active' : ''}`}
              onClick={() => setLang('nl')}
              aria-pressed={lang === 'nl'}>NL</button>
            <button
              className={`om-lang-opt ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}>EN</button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ProgressRail({ qs, answers, current, pct, lang, phase, onSectionClick }) {
  const sections = window.SECTIONS;
  const currentSection = phase === 'review' ? 8 : (current?.section || 0);
  // A section is reachable if any of its questions are currently visible (sections
  // 2 and 4 are conditional). Section 8 = review, always reachable.
  const reachable = new Set(qs.map(q => q.section));
  reachable.add(8);
  return (
    <div className="om-progress">
      <div className="om-progress-inner">
        <div className="om-steps">
          {sections.map((s, i) => {
            const done = s.id < currentSection;
            const active = s.id === currentSection;
            const canClick = reachable.has(s.id);
            return (
              <React.Fragment key={s.id}>
                {i > 0 && <div className="om-step-sep" />}
                <button type="button"
                  className={`om-step ${done ? 'done' : ''} ${active ? 'active' : ''} ${canClick ? 'clickable' : ''}`}
                  onClick={() => canClick && onSectionClick && onSectionClick(s.id)}
                  disabled={!canClick}>
                  <span className="om-step-num">{done ? '' : s.id}</span>
                  <span className="om-step-label">{s[lang]}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="om-percent"><strong>{pct}%</strong></div>
      </div>
    </div>
  );
}

function Landing({ lang, onCommit, hasSaved, onDiscard }) {
  const L = window.I18N[lang];
  const title = lang === 'nl'
    ? <>Breng <em>Nelsons Film</em><br/>naar jouw wijk.</>
    : <>Bring <em>Nelsons Film</em><br/>to your neighbourhood.</>;
  return (
    <main className="om-landing om-fade-in">
      <div className="om-landing-content">
        {hasSaved && (
          <div className="om-resume-pill">
            <strong>✓ {L.resumeLabel}</strong>
            <button onClick={onDiscard}>{L.resumeDiscard}</button>
          </div>
        )}
        <div className="om-landing-kicker">{L.kicker}</div>
        <h1 className="om-landing-title">{title}</h1>
        <p className="om-landing-lede">{L.landingLede}</p>
        <div className="om-landing-meta">
          <span>{L.landingMeta1}</span>
          <span>{L.landingMeta2}</span>
          <span>{L.landingMeta3}</span>
        </div>
        <button className="om-commit" onClick={onCommit}>
          {hasSaved ? L.resumeCta : L.commitCta}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <p className="om-commit-hint">{L.commitHint}</p>
      </div>
      <div className="om-landing-art">
        <div className="om-marquee-lights">
          {Array.from({ length: 18 }).map((_, i) => <span key={i} className="om-bulb" />)}
        </div>
        <img src="/images/outdoor-sunset.jpg" alt="" />
        <div className="om-landing-art-caption">
          "Het publiek staarde naar het scherm alsof ze de sterren zagen opkomen."
          <small>{lang === 'nl' ? 'Haarlem Noord — Zomer 2025' : 'Haarlem Noord — Summer 2025'}</small>
        </div>
      </div>
    </main>
  );
}

function QuestionScreen({ q, answers, setAns, next, back, err, lang, index, total }) {
  const L = window.I18N[lang];
  const section = window.SECTIONS.find(s => s.id === q.section);
  return (
    <main className="om-main om-fade-in">
      <div className="om-q-meta">
        <span>{L.sectionWord} {q.section} · {section[lang]}</span>
        <span className="dot" />
        <span>{L.questionWord} {index + 1} / {total}</span>
        {q.required && <><span className="dot" /><span className="om-q-required">{L.required}</span></>}
        {!q.required && <><span className="dot" /><span>{L.optional}</span></>}
      </div>
      <h1 className="om-q-title">{q[lang].title}</h1>
      {q[lang].help && <p className="om-q-help">{q[lang].help}</p>}

      <QuestionInput q={q} answer={answers[q.id]} setAnswer={(v) => setAns(q.id, v)} lang={lang} />

      {err && <div className="om-err">⚠ {err}</div>}

      <div className="om-q-actions">
        <button className="om-btn om-btn-ghost" onClick={back}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {L.back}
        </button>
        <button className="om-btn om-btn-primary" onClick={next}>
          {index + 1 === total ? L.review : L.next}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </main>
  );
}

function formatAnswerShort(q, ans, lang) {
  if (ans == null || ans === '' || (Array.isArray(ans) && !ans.length)) return null;
  const L = q[lang];
  if (q.kind === 'text-group') {
    return L.fields.map(f => ans[f.key] ? `${f.label}: ${ans[f.key]}` : null).filter(Boolean).join(' · ');
  }
  if (q.kind === 'single' || q.kind === 'single-text') {
    const v = typeof ans === 'object' ? ans.value : ans;
    const opt = L.options?.find(o => o.value === v);
    const base = opt?.label || v;
    const extra = typeof ans === 'object' && ans.text ? ` — "${ans.text}"` : '';
    return base + extra;
  }
  if (q.kind === 'multi') {
    const arr = Array.isArray(ans) ? ans : (ans.values || []);
    const others = ans.others || {};
    return arr.map(v => {
      const o = L.options.find(o => o.value === v);
      return o ? (others[v] ? `${o.label} (${others[v]})` : o.label) : v;
    }).join(', ');
  }
  if (q.kind === 'multi-cards') {
    return ans.map(v => L.options.find(o => o.value === v)?.label).filter(Boolean).join(', ');
  }
  if (q.kind === 'long') return ans.length > 200 ? ans.slice(0, 200) + '…' : ans;
  if (q.kind === 'euro') return `€${Number(ans).toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB')} ${lang === 'nl' ? 'per editie' : 'per screening'}`;
  return String(ans);
}

function ReviewScreen({ answers, lang, back, onEdit, signature, setSignature, agreed, setAgreed, onSubmit, submitting, submitErr, onPreviewPdf }) {
  const L = window.I18N[lang];
  const qs = visibleQuestions(answers);
  const bySection = {};
  qs.forEach(q => { (bySection[q.section] ||= []).push(q); });
  return (
    <main className="om-main om-fade-in om-review-wrap">
      <div className="om-q-meta">
        <span>{L.sectionWord} 8 · {window.SECTIONS[7][lang]}</span>
        <span className="dot" />
        <span>{lang === 'nl' ? 'Laatste stap' : 'Final step'}</span>
      </div>
      <h1 className="om-q-title">{L.reviewTitle}</h1>
      <p className="om-q-help">{L.reviewLede}</p>

      <div className="om-review-list">
        {Object.keys(bySection).map(sid => (
          <React.Fragment key={sid}>
            <div className="om-review-section-head">{window.SECTIONS.find(s => s.id === Number(sid))[lang]}</div>
            {bySection[sid].map(q => {
              const a = formatAnswerShort(q, answers[q.id], lang);
              return (
                <div key={q.id} className="om-review-row">
                  <div className="om-review-q">{q[lang].title}</div>
                  <div className={`om-review-a ${!a ? 'empty' : ''}`}>{a || (lang === 'nl' ? '— niet ingevuld' : '— not filled')}</div>
                  <button className="om-review-edit" onClick={() => onEdit(q.id)}>{L.edit}</button>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <button className="om-pdf-preview-btn" onClick={onPreviewPdf}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        {L.previewPdf}
      </button>

      <div className="om-sign-wrap">
        <h2 className="om-sign-title">{L.signTitle}</h2>
        <p className="om-sign-body">{L.signBody}</p>
        <SignaturePad value={signature} onChange={setSignature} lang={lang} />
        <p className="om-sign-reassure">{L.signReassure}</p>
      </div>

      <label className="om-agree">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>{L.signAgree}</span>
      </label>

      {submitErr && (
        <div className="om-err" style={{ marginBottom: 16 }}>
          ⚠ {lang === 'nl'
            ? 'Versturen mislukt. Controleer je verbinding en probeer opnieuw.'
            : 'Submission failed. Check your connection and try again.'} <span style={{ opacity: 0.6 }}>({submitErr})</span>
        </div>
      )}

      <div className="om-q-actions">
        <button className="om-btn om-btn-ghost" onClick={back} disabled={submitting}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {L.back}
        </button>
        <button className="om-btn om-btn-primary" disabled={!agreed || !signature?.data || submitting} onClick={onSubmit}>
          {submitting ? (lang === 'nl' ? 'Versturen…' : 'Sending…') : L.submit}
          {!submitting && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
        </button>
      </div>
    </main>
  );
}

function Confirmation({ lang, onPreviewPdf }) {
  const L = window.I18N[lang];
  return (
    <main className="om-main om-conf">
      <div className="om-conf-badge">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1 className="om-conf-title">{L.confTitle}</h1>
      <p className="om-conf-lede">{L.confLede}</p>

      <div className="om-timeline">
        <div className="om-tl-step"><div className="om-tl-num">1</div>
          <div className="om-tl-body"><h3>{L.confStep1Title}</h3><p>{L.confStep1Body}</p></div></div>
        <div className="om-tl-step"><div className="om-tl-num">2</div>
          <div className="om-tl-body"><h3>{L.confStep2Title}</h3><p>{L.confStep2Body}</p></div></div>
        <div className="om-tl-step"><div className="om-tl-num">3</div>
          <div className="om-tl-body"><h3>{L.confStep3Title}</h3><p>{L.confStep3Body}</p></div></div>
      </div>

      <div className="om-conf-actions">
        <button className="om-btn om-btn-primary" onClick={onPreviewPdf}>{L.previewPdf}</button>
        <button className="om-btn om-btn-secondary" onClick={onPreviewPdf}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {L.downloadAnswers}
        </button>
      </div>
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById('om-root'));
root.render(<App />);
