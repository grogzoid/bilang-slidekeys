#!/usr/bin/env node
/**
 * Lightweight pre-commit validation for the userscript bundle.
 * Catches the kinds of bugs that node --check alone misses:
 *   - References to undefined globals (e.g. globalThis if it doesn't exist)
 *   - Top-level errors during the politeness check / IIFE body
 *
 * Strategy: load the bundle into a fake DOM-like sandbox using vm and
 * a minimal stub of browser globals. The userscript should run far enough
 * to register the custom element without throwing. If it throws, the
 * exception location identifies the problem.
 *
 * Run: node userscript/validate.js
 *
 * Exit codes:
 *   0  bundle loaded clean
 *   1  bundle threw at runtime
 *   2  bundle has syntax errors
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundlePath = resolve(__dirname, 'bilang-slidekeys.user.js');
const code = readFileSync(bundlePath, 'utf8');

// Minimal stubs that pretend to be browser globals enough for the bundle
// to reach the end of its IIFE without crashing. We do NOT try to
// emulate full DOM behavior — just provide the surface our top-level
// code touches before async event handlers fire.
function makeStubElement() {
  const listeners = {};
  const el = {
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
    hasAttribute() { return false; },
    appendChild() {}, removeChild() {}, querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    removeEventListener() {},
    attachShadow(_opts) {
      return { ...makeStubElement(), host: el, mode: 'open' };
    },
    dispatchEvent() {},
    children: [],
    childNodes: [],
    parentNode: null,
    cloneNode() { return makeStubElement(); },
    focus() {}, blur() {},
    getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    offsetHeight: 0, offsetWidth: 0, offsetTop: 0, offsetLeft: 0,
    scrollTop: 0, scrollLeft: 0,
    innerHTML: '', textContent: '', outerHTML: '',
    dataset: {},
  };
  return el;
}

const customElements_registry = new Map();
const fakeWindow = {
  innerWidth: 1280, innerHeight: 900,
  outerWidth: 1280, outerHeight: 900,
  setTimeout, clearTimeout, setInterval, clearInterval,
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
  cancelAnimationFrame: clearTimeout,
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  navigator: { clipboard: { writeText: () => Promise.resolve() }, userAgent: 'node-validate' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] ?? null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
  },
  documentPictureInPicture: undefined,
  location: { hostname: 'example.com', protocol: 'https:', href: 'https://example.com/' },
  __bilangSlidekeys__: undefined,
  CustomEvent: class CustomEvent { constructor(type, opts = {}) { Object.assign(this, opts.detail || {}); this.type = type; this.detail = opts.detail || {}; } },
  Event: class Event { constructor(type) { this.type = type; } },
};
fakeWindow.window = fakeWindow;
fakeWindow.globalThis = fakeWindow;

const fakeDocument = {
  body: makeStubElement(),
  head: makeStubElement(),
  documentElement: makeStubElement(),
  createElement: () => makeStubElement(),
  createTextNode: () => ({ nodeType: 3, textContent: '' }),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener() {}, removeEventListener() {},
  dispatchEvent() {},
  activeElement: null,
  readyState: 'complete',
  execCommand() { return true; },
  defaultView: fakeWindow,
};
fakeWindow.document = fakeDocument;

const fakeCustomElements = {
  define(name, ctor) {
    if (customElements_registry.has(name)) {
      throw new DOMException(`'define' on 'CustomElementRegistry': "${name}" already used.`);
    }
    customElements_registry.set(name, ctor);
  },
  get(name) { return customElements_registry.get(name); },
};
fakeWindow.customElements = fakeCustomElements;

class HTMLElement {
  constructor() { Object.assign(this, makeStubElement()); }
}
fakeWindow.HTMLElement = HTMLElement;

class DOMException extends Error {
  constructor(msg) { super(msg); this.name = 'DOMException'; }
}
fakeWindow.DOMException = DOMException;

// Strip the userscript metadata block — vm.runInContext doesn't like leading line comments.
// (Actually it does, but the metadata makes the trace less useful.)
const codeWithoutHeader = code.replace(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\n/, '');

// Use the fakeWindow object itself as the context so all globals live
// on a single object — and any property set on `window`/`globalThis`
// inside the IIFE is observable from outside.
Object.assign(fakeWindow, {
  unsafeWindow: undefined,
  GM_registerMenuCommand: () => {},
  GM_setValue: () => {},
  GM_getValue: (k, d) => d,
  console: { log() {}, warn() {}, error() {}, info() {} },
});
const ctx = vm.createContext(fakeWindow);

console.log('[validate] running bundle in stub sandbox (unsafeWindow=undefined to test fallback path)...');
try {
  vm.runInContext(codeWithoutHeader, ctx, { filename: 'bilang-slidekeys.user.js' });
  console.log('[validate] OK: bundle loaded without throwing');
  // Also assert the politeness flag was set (proves we reached past the IIFE entry)
  if (!ctx.__bilangSlidekeys__) {
    console.error('[validate] WARN: window.__bilangSlidekeys__ was not set — IIFE may have bailed early');
    process.exit(1);
  }
  console.log('[validate] flag set:', JSON.stringify(ctx.__bilangSlidekeys__));
} catch (err) {
  console.error('[validate] FAIL:', err.message);
  if (err.stack) {
    console.error(err.stack.split('\n').slice(0, 8).join('\n'));
  }
  process.exit(1);
}

// Second pass: with unsafeWindow defined (simulates Tampermonkey @grant mode)
// Reset the flag and re-build a fresh context.
delete fakeWindow.__bilangSlidekeys__;
customElements_registry.clear();
fakeWindow.unsafeWindow = fakeWindow;
console.log('[validate] running bundle with unsafeWindow defined (simulates real TM sandbox)...');
const ctx2 = vm.createContext(fakeWindow);
try {
  vm.runInContext(codeWithoutHeader, ctx2, { filename: 'bilang-slidekeys.user.js' });
  console.log('[validate] OK: bundle loaded with unsafeWindow path');
} catch (err) {
  console.error('[validate] FAIL with unsafeWindow:', err.message);
  process.exit(1);
}

console.log('[validate] all checks passed');
