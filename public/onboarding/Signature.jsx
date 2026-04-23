// Signature pad + PDF preview
const { useState: useSigState, useRef: useSigRef, useEffect: useSigEffect } = React;

function SignaturePad({ value, onChange, lang }) {
  const L = window.I18N[lang];
  const initialMode = value?.mode === 'type' ? 'type' : 'draw';
  const [mode, setMode] = useSigState(initialMode);
  const canvasRef = useSigRef(null);
  const drawing = useSigRef(false);
  const hasInk = useSigRef(false);
  const lastPt = useSigRef(null);

  const typedName = (value?.mode === 'type' ? value.data : '') || '';
  const onTypeChange = (e) => onChange({ mode: 'type', data: e.target.value });

  // Initialise / resize canvas for crisp drawing on high-DPI screens, and
  // restore any previously saved drawing when switching back to draw mode.
  useSigEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#1B2F4A';
      // Restore if we already have saved ink
      if (value?.mode === 'draw' && value.data) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          hasInk.current = true;
        };
        img.src = value.data;
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
        hasInk.current = false;
      }
    };
    setup();
    window.addEventListener('resize', setup);
    return () => window.removeEventListener('resize', setup);
  }, [mode]);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches && e.touches[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPt.current = getPoint(e);
  };
  const moveDraw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = getPoint(e);
    const last = lastPt.current;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPt.current = p;
    hasInk.current = true;
  };
  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasInk.current) {
      const data = canvasRef.current.toDataURL('image/png');
      onChange({ mode: 'draw', data });
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasInk.current = false;
    onChange({ mode: 'draw', data: '' });
  };

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    // Starting a fresh mode clears the previous signature shape.
    onChange(null);
  };

  return (
    <div>
      <div className="om-sign-tabs" role="tablist">
        <button type="button" className={`om-sign-tab ${mode === 'type' ? 'active' : ''}`}
          onClick={() => switchMode('type')} aria-pressed={mode === 'type'}>
          {L.signTyped}
        </button>
        <button type="button" className={`om-sign-tab ${mode === 'draw' ? 'active' : ''}`}
          onClick={() => switchMode('draw')} aria-pressed={mode === 'draw'}>
          {L.signDraw}
        </button>
      </div>

      {mode === 'type' && (
        <>
          <div className="om-sign-typed-preview">
            {typedName || (lang === 'nl' ? 'Je handtekening verschijnt hier' : 'Your signature appears here')}
          </div>
          <input className="om-sign-typed-input" value={typedName} onChange={onTypeChange}
            placeholder={lang === 'nl' ? 'Voornaam Achternaam' : 'First Last'} />
        </>
      )}

      {mode === 'draw' && (
        <div className="om-sign-canvas-wrap">
          <canvas ref={canvasRef} className="om-sign-canvas"
            onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw} />
          <div className="om-sign-guideline" />
          <div className="om-sign-hint">
            {lang === 'nl' ? 'Teken hier' : 'Sign here'}
          </div>
        </div>
      )}

      <div className="om-sign-footer">
        <span>{lang === 'nl' ? 'Ondertekend' : 'Signed'} · {new Date().toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB')}</span>
        {mode === 'draw' && (
          <button type="button" className="om-sign-clear" onClick={clear}>{L.signClear}</button>
        )}
      </div>
    </div>
  );
}

// ---- Answer formatter: turn a question + answer into display rows ----
function formatAnswer(q, answers, lang) {
  const v = answers[q.id];
  if (v === undefined || v === null || v === '') return null;
  const L = q[lang];

  if (q.kind === 'text-group') {
    const rows = L.fields
      .map(f => ({ label: f.label, value: (v || {})[f.key] || '' }))
      .filter(r => r.value.trim());
    return rows.length ? { type: 'rows', rows } : null;
  }

  if (q.kind === 'single' || q.kind === 'single-text') {
    const val = typeof v === 'object' && v ? v.value : v;
    const opt = L.options.find(o => o.value === val);
    if (!opt) return null;
    const extra = (typeof v === 'object' && v && v.text) || answers[q.id + '__text'];
    return { type: 'text', text: opt.label + (extra ? ` — "${extra}"` : '') };
  }

  if (q.kind === 'multi' || q.kind === 'multi-cards') {
    const arr = Array.isArray(v) ? v : (v && Array.isArray(v.values) ? v.values : []);
    if (!arr.length) return null;
    const others = (v && typeof v === 'object' && v.others) || {};
    const items = arr.map(val => {
      const opt = L.options.find(o => o.value === val);
      if (!opt) return null;
      const extra = others[val] || answers[q.id + '__' + val + '_text'];
      return opt.label + (extra ? ` — "${extra}"` : '');
    }).filter(Boolean);
    return { type: 'list', items };
  }

  if (q.kind === 'long') {
    return { type: 'quote', text: String(v) };
  }

  if (q.kind === 'euro') {
    const n = Number(v);
    if (!n) return null;
    return { type: 'text', text: '€ ' + n.toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB') + (lang === 'nl' ? ' per editie' : ' per screening') };
  }

  return { type: 'text', text: String(v) };
}

// Group visible questions by section
function groupBySection(answers, lang) {
  const qs = (window.QUESTIONS || []).filter(q => !q.deps || q.deps(answers));
  const sectionTitles = window.I18N[lang].sections || [];
  const map = new Map();
  qs.forEach(q => {
    if (!map.has(q.section)) map.set(q.section, []);
    map.get(q.section).push(q);
  });
  return [...map.entries()].map(([section, questions]) => ({
    section,
    title: sectionTitles[section - 1] || `Section ${section}`,
    questions,
  }));
}

// ---- PDF preview ----
function PdfPreview({ answers, signature, lang, onClose }) {
  const docRef = useSigRef(null);
  const [busy, setBusy] = useSigState(false);
  const name = answers.contact?.firstName && answers.contact?.lastName
    ? `${answers.contact.firstName} ${answers.contact.lastName}` : '—';
  const org = answers.orgDetails?.orgName || (answers.behalfOf === 'self' ? (lang === 'nl' ? 'Privépersoon' : 'Private individual') : '—');
  const date = new Date().toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const groups = groupBySection(answers, lang);

  const downloadPdf = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const el = docRef.current;
      if (!el) throw new Error('no doc');
      // Ensure fonts are ready
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch(_) {} }
      const canvas = await window.html2canvas(el, {
        scale: 2, backgroundColor: '#f7f1e7', useCORS: true,
        windowWidth: el.scrollWidth, windowHeight: el.scrollHeight,
      });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const img = canvas.toDataURL('image/jpeg', 0.92);

      if (imgH <= pageH - margin * 2) {
        pdf.addImage(img, 'JPEG', margin, margin, imgW, imgH);
      } else {
        // Slice across pages
        const pageContentH = pageH - margin * 2;
        const pxPerPt = canvas.width / imgW;
        const sliceHpx = pageContentH * pxPerPt;
        let ypx = 0;
        while (ypx < canvas.height) {
          const hpx = Math.min(sliceHpx, canvas.height - ypx);
          const slice = document.createElement('canvas');
          slice.width = canvas.width; slice.height = hpx;
          slice.getContext('2d').drawImage(canvas, 0, ypx, canvas.width, hpx, 0, 0, canvas.width, hpx);
          const sliceImg = slice.toDataURL('image/jpeg', 0.92);
          const sliceHpt = (hpx * imgW) / canvas.width;
          if (ypx > 0) pdf.addPage();
          pdf.addImage(sliceImg, 'JPEG', margin, margin, imgW, sliceHpt);
          ypx += hpx;
        }
      }
      const safe = (name === '—' ? 'partner' : name.replace(/\s+/g, '-').toLowerCase());
      pdf.save(`nelsons-film-samenwerking-${safe}.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
      alert(lang === 'nl' ? 'PDF-download mislukt. Probeer opnieuw.' : 'PDF download failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="om-modal-backdrop" onClick={onClose}>
      <div className="om-pdf-shell" onClick={(e) => e.stopPropagation()}>
        <div className="om-pdf-toolbar">
          <div className="om-pdf-toolbar-title">
            {lang === 'nl' ? 'Concept-verklaring' : 'Draft statement'}
          </div>
          <div className="om-pdf-toolbar-actions">
            <button className="om-btn om-btn-primary om-btn-sm" onClick={downloadPdf} disabled={busy}>
              {busy
                ? (lang === 'nl' ? 'Bezig…' : 'Working…')
                : (lang === 'nl' ? 'Download PDF' : 'Download PDF')}
            </button>
            <button className="om-pdf-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        <div className="om-pdf-scroll">
          <div className="om-pdf-modal" ref={docRef}>
            <div className="pdf-sub">{lang === 'nl' ? 'CONCEPT — NELSON\u2019S FILM' : 'DRAFT — NELSON\u2019S FILM'}</div>
            <h1>{lang === 'nl' ? 'Samenwerkingsverklaring 2026' : 'Collaboration Statement 2026'}</h1>
            <div className="pdf-divider" />

            <p>{lang === 'nl'
              ? `Op ${date} verklaart ondergetekende, namens ${org}, steun toe te zeggen aan het initiatief Nelson\u2019s Film voor het seizoen 2026 in de door partijen nader te bepalen wijk.`
              : `On ${date} the undersigned, on behalf of ${org}, expresses their support for Nelson\u2019s Film for the 2026 season in the neighbourhood to be mutually determined.`}</p>

            {groups.map(g => {
              // collect renderable answers for this section
              const rendered = g.questions
                .map(q => ({ q, out: formatAnswer(q, answers, lang) }))
                .filter(x => x.out);
              if (!rendered.length) return null;
              return (
                <div key={g.section} className="pdf-section">
                  <h2>{g.title}</h2>
                  {rendered.map(({ q, out }, i) => (
                    <div key={q.id} className="pdf-qa">
                      <div className="pdf-q">{q[lang].title}</div>
                      {out.type === 'rows' && (
                        <div className="pdf-rows">
                          {out.rows.map((r, j) => (
                            <div key={j} className="pdf-meta-row">
                              <strong>{r.label}</strong><span>{r.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {out.type === 'text' && <div className="pdf-a">{out.text}</div>}
                      {out.type === 'list' && (
                        <ul className="pdf-list">
                          {out.items.map((it, j) => <li key={j}>{it}</li>)}
                        </ul>
                      )}
                      {out.type === 'quote' && (
                        <blockquote className="pdf-quote">"{out.text}"</blockquote>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            <div className="om-pdf-signline">
              <div className="om-pdf-signbox">
                {signature?.mode === 'draw' && signature.data && <img src={signature.data} className="sig-img" alt="signature" />}
                {signature?.mode === 'type' && signature.data && <div className="sig-typed">{signature.data}</div>}
                {!signature?.data && <div style={{ height: 50 }} />}
                <small>{name} · {date}</small>
              </div>
              <div className="om-pdf-signbox">
                <div style={{ height: 50 }} />
                <small>{lang === 'nl' ? 'Voor Nelson\u2019s Film — volgt na ontvangst' : 'For Nelson\u2019s Film — to follow'}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SignaturePad, PdfPreview });
