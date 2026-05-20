/**
 * SearchableSelect — single-select combobox with type-to-filter.
 *
 * Used by Add/Edit record modals when a `select` would have too many
 * options to scroll comfortably (e.g. picking a Faculty for a Program
 * Chair). The input doubles as a search filter; clicking an option
 * commits it and shows the label in the input.
 */
import React from 'react';
import { ChevronDown, X } from 'react-feather';

const SearchableSelect = ({ value, onChange, options, placeholder }) => {
  const [query, setQuery] = React.useState('');
  const [open, setOpen]   = React.useState(false);
  const wrapRef = React.useRef(null);

  // Click outside closes the dropdown.
  React.useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Normalize options to {value, label}.
  const normOptions = React.useMemo(() => {
    return (options || []).map((o) => typeof o === 'string' ? { value: o, label: o } : o);
  }, [options]);

  // When the popup is closed the input displays the selected label.
  // When it's open the input becomes a search field.
  const selectedLabel = React.useMemo(() => {
    const m = normOptions.find((o) => o.value === value);
    return m ? m.label : '';
  }, [normOptions, value]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normOptions;
    return normOptions.filter((o) => o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q));
  }, [normOptions, query]);

  const commit = (v) => { onChange(v); setQuery(''); setOpen(false); };
  const clear  = () => { onChange(''); setQuery(''); };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div
        onClick={() => { if (!open) setOpen(true); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 40, padding: '0 8px 0 12px',
          border: '1px solid #D1D5DB', borderRadius: 6, background: '#FFFFFF',
          cursor: 'text',
        }}
      >
        <input
          value={open ? query : selectedLabel}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || 'Search…'}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }}
        />
        {value && !open && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clear(); }}
            title="Clear"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'inline-flex' }}
          >
            <X size={16} color="#6B7280" />
          </button>
        )}
        <ChevronDown size={16} color="#6B7280" />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            maxHeight: 220, overflowY: 'auto', background: '#FFFFFF',
            border: '1px solid #D1D5DB', borderRadius: 6, zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280' }}>No matches.</div>
          )}
          {filtered.map((o) => (
            <button
              type="button"
              key={o.value}
              onClick={() => commit(o.value)}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 12px',
                border: 'none', borderBottom: '1px solid #F3F4F6',
                background: o.value === value ? '#F3F4F6' : '#FFFFFF',
                color: '#111827', cursor: 'pointer', fontSize: 14,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
