import { useRef, useEffect } from 'react';

/**
 * React wrapper for the <bilingual-keyboard> web component.
 *
 * Props:
 *   activeLang        - "en" | "uk" (default "uk")
 *   inputMode         - "bound" | "focus" | "internal" (default "bound")
 *   visible           - boolean
 *   onKeyInput        - ({ char, lang }) => void
 *   onLangChange      - ({ lang }) => void
 *   onVisibilityChange - ({ visible }) => void
 */
export default function BilingualKeyboard({
  activeLang = 'uk',
  inputMode = 'bound',
  visible = false,
  onKeyInput,
  onLangChange,
  onVisibilityChange,
}) {
  const ref = useRef(null);

  // Sync attributes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute('active-lang', activeLang);
  }, [activeLang]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute('input-mode', inputMode);
  }, [inputMode]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (visible) {
      el.setAttribute('visible', '');
    } else {
      el.removeAttribute('visible');
    }
  }, [visible]);

  // Attach event listeners
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handlers = [];

    if (onKeyInput) {
      const h = (e) => onKeyInput(e.detail);
      el.addEventListener('key-input', h);
      handlers.push(['key-input', h]);
    }
    if (onLangChange) {
      const h = (e) => onLangChange(e.detail);
      el.addEventListener('lang-change', h);
      handlers.push(['lang-change', h]);
    }
    if (onVisibilityChange) {
      const h = (e) => onVisibilityChange(e.detail);
      el.addEventListener('visibility-change', h);
      handlers.push(['visibility-change', h]);
    }

    return () => {
      for (const [evt, h] of handlers) {
        el.removeEventListener(evt, h);
      }
    };
  }, [onKeyInput, onLangChange, onVisibilityChange]);

  return <bilingual-keyboard ref={ref} />;
}
