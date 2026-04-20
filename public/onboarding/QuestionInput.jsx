// Question input components
const { useState, useEffect, useRef } = React;

function OptionBtn({ selected, single, onClick, children }) {
  return (
    <button type="button" className={`om-option ${single ? 'single' : ''} ${selected ? 'selected' : ''}`} onClick={onClick}>
      <span className="om-option-box" />
      <span className="om-option-body">{children}</span>
    </button>
  );
}

function QText({ q, answer, setAnswer, lang }) {
  const L = q[lang];
  const val = answer || {};
  return (
    <div className="om-fields-grid">
      {L.fields.map(f => (
        <div key={f.key} className={`om-field ${f.wide ? 'wide' : ''}`}>
          <label className="om-field-label">
            {f.label}
            {f.optional ? <span className="om-opt-tag">{lang === 'nl' ? 'optioneel' : 'optional'}</span> : <span className="om-req-star" aria-label="required">*</span>}
          </label>
          <input
            className="om-input"
            type={f.type}
            value={val[f.key] || ''}
            onChange={(e) => setAnswer({ ...val, [f.key]: e.target.value })}
            autoComplete="off"
          />
        </div>
      ))}
    </div>
  );
}

function QSingle({ q, answer, setAnswer, lang }) {
  const L = q[lang];
  return (
    <div className={`om-options ${L.columns === 2 ? 'two-col' : ''}`}>
      {L.options.map(o => {
        const selected = answer === o.value || (typeof answer === 'object' && answer?.value === o.value);
        return (
          <OptionBtn key={o.value} single selected={selected}
            onClick={() => setAnswer(o.freeText ? { value: o.value, text: (typeof answer === 'object' ? answer?.text : '') || '' } : o.value)}>
            <div className="om-option-label">{o.label}</div>
            {o.sub && <div className="om-option-sub">{o.sub}</div>}
          </OptionBtn>
        );
      })}
    </div>
  );
}

function QSingleText({ q, answer, setAnswer, lang }) {
  const L = q[lang];
  const cur = typeof answer === 'object' && answer ? answer : (answer ? { value: answer } : {});
  return (
    <div className="om-options">
      {L.options.map(o => {
        const selected = cur.value === o.value;
        return (
          <div key={o.value}>
            <OptionBtn single selected={selected}
              onClick={() => setAnswer({ value: o.value, text: cur.text || '' })}>
              <div className="om-option-label">{o.label}</div>
            </OptionBtn>
            {selected && o.freeText && (
              <textarea
                className="om-option-freetext"
                rows={3}
                placeholder={o.freeText}
                value={cur.text || ''}
                onChange={(e) => setAnswer({ value: o.value, text: e.target.value })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function QMulti({ q, answer, setAnswer, lang }) {
  const L = q[lang];
  const arr = Array.isArray(answer) ? answer : (answer?.values || []);
  const others = answer?.others || {};
  const toggle = (v) => {
    const has = arr.includes(v);
    const nextArr = has ? arr.filter(x => x !== v) : [...arr, v];
    setAnswer({ values: nextArr, others });
  };
  return (
    <div className={`om-options ${L.columns === 2 ? 'two-col' : ''}`}>
      {L.options.map(o => {
        const selected = arr.includes(o.value);
        return (
          <div key={o.value}>
            <OptionBtn selected={selected} onClick={() => toggle(o.value)}>
              <div className="om-option-label">{o.label}</div>
            </OptionBtn>
            {selected && o.freeText && (
              <input
                className="om-option-freetext"
                placeholder={o.freeText}
                value={others[o.value] || ''}
                onChange={(e) => setAnswer({ values: arr, others: { ...others, [o.value]: e.target.value } })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function QMultiCards({ q, answer, setAnswer, lang }) {
  const L = q[lang];
  const arr = Array.isArray(answer) ? answer : [];
  const toggle = (v) => {
    setAnswer(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };
  return (
    <div className="om-cards">
      {L.options.map(o => {
        const selected = arr.includes(o.value);
        return (
          <button key={o.value} type="button"
            className={`om-card-option ${selected ? 'selected' : ''}`}
            onClick={() => toggle(o.value)}>
            <div className="om-card-label">{o.label}</div>
            <div className="om-card-sub">{o.sub}</div>
            <div className="om-card-check">{selected ? '✓' : ''}</div>
          </button>
        );
      })}
    </div>
  );
}

function QLong({ q, answer, setAnswer, lang }) {
  const L = q[lang];
  const text = answer || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minW = q.minWords || 0;
  const counterClass = minW ? (words >= minW ? 'ok' : 'warn') : '';
  return (
    <>
      <textarea className="om-textarea" value={text} placeholder={L.placeholder || ''}
        onChange={(e) => setAnswer(e.target.value)} />
      <div className="om-long-footer">
        <span>{minW ? `${lang === 'nl' ? 'Minimaal' : 'Min.'} ${minW} ${lang === 'nl' ? 'woorden' : 'words'}` : ''}</span>
        {minW > 0 && <span className={`om-long-counter ${counterClass}`}>{words} / {minW}</span>}
      </div>
    </>
  );
}

function QEuro({ q, answer, setAnswer, lang }) {
  const L = q[lang];
  const val = answer || '';
  return (
    <div className="om-euro-wrap">
      <div className="om-euro">
        <span className="om-euro-sign">€</span>
        <input type="number" min={L.min} placeholder={L.min}
          value={val} onChange={(e) => setAnswer(e.target.value)} />
        <span className="om-euro-per">{lang === 'nl' ? 'per editie' : 'per screening'}</span>
      </div>
      <div className="om-euro-chips">
        {L.suggest.map(v => (
          <button key={v} type="button"
            className={`om-euro-chip ${Number(val) === v ? 'active' : ''}`}
            onClick={() => setAnswer(String(v))}>€{v.toLocaleString('nl-NL')}</button>
        ))}
      </div>
    </div>
  );
}

function QuestionInput({ q, answer, setAnswer, lang }) {
  const props = { q, answer, setAnswer, lang };
  switch (q.kind) {
    case 'text-group': return <QText {...props} />;
    case 'single': return <QSingle {...props} />;
    case 'single-text': return <QSingleText {...props} />;
    case 'multi': return <QMulti {...props} />;
    case 'multi-cards': return <QMultiCards {...props} />;
    case 'long': return <QLong {...props} />;
    case 'euro': return <QEuro {...props} />;
    default: return null;
  }
}

Object.assign(window, { QuestionInput });
