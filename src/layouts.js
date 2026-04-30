// Bilingual keyboard key mappings: EN (QWERTY) <-> UK (Ukrainian Windows layout)
// Each key object maps a physical key position to both language outputs.

export const keymap = [
  // Row 0: Number row
  [
    { en: '`', enShift: '~', uk: "'", ukShift: '₴', code: 'Backquote' },
    { en: '1', enShift: '!', uk: '1', ukShift: '!', code: 'Digit1' },
    { en: '2', enShift: '@', uk: '2', ukShift: '"', code: 'Digit2' },
    { en: '3', enShift: '#', uk: '3', ukShift: '№', code: 'Digit3' },
    { en: '4', enShift: '$', uk: '4', ukShift: ';', code: 'Digit4' },
    { en: '5', enShift: '%', uk: '5', ukShift: '%', code: 'Digit5' },
    { en: '6', enShift: '^', uk: '6', ukShift: ':', code: 'Digit6' },
    { en: '7', enShift: '&', uk: '7', ukShift: '?', code: 'Digit7' },
    { en: '8', enShift: '*', uk: '8', ukShift: '*', code: 'Digit8' },
    { en: '9', enShift: '(', uk: '9', ukShift: '(', code: 'Digit9' },
    { en: '0', enShift: ')', uk: '0', ukShift: ')', code: 'Digit0' },
    { en: '-', enShift: '_', uk: '-', ukShift: '_', code: 'Minus' },
    { en: '=', enShift: '+', uk: '=', ukShift: '+', code: 'Equal' },
  ],
  // Row 1: QWERTY row
  [
    { en: 'q', enShift: 'Q', uk: 'й', ukShift: 'Й', code: 'KeyQ' },
    { en: 'w', enShift: 'W', uk: 'ц', ukShift: 'Ц', code: 'KeyW' },
    { en: 'e', enShift: 'E', uk: 'у', ukShift: 'У', code: 'KeyE' },
    { en: 'r', enShift: 'R', uk: 'к', ukShift: 'К', code: 'KeyR' },
    { en: 't', enShift: 'T', uk: 'е', ukShift: 'Е', code: 'KeyT' },
    { en: 'y', enShift: 'Y', uk: 'н', ukShift: 'Н', code: 'KeyY' },
    { en: 'u', enShift: 'U', uk: 'г', ukShift: 'Г', code: 'KeyU' },
    { en: 'i', enShift: 'I', uk: 'ш', ukShift: 'Ш', code: 'KeyI' },
    { en: 'o', enShift: 'O', uk: 'щ', ukShift: 'Щ', code: 'KeyO' },
    { en: 'p', enShift: 'P', uk: 'з', ukShift: 'З', code: 'KeyP' },
    { en: '[', enShift: '{', uk: 'х', ukShift: 'Х', code: 'BracketLeft' },
    { en: ']', enShift: '}', uk: 'ї', ukShift: 'Ї', code: 'BracketRight' },
  ],
  // Row 2: Home row
  [
    { en: 'a', enShift: 'A', uk: 'ф', ukShift: 'Ф', code: 'KeyA' },
    { en: 's', enShift: 'S', uk: 'і', ukShift: 'І', code: 'KeyS' },
    { en: 'd', enShift: 'D', uk: 'в', ukShift: 'В', code: 'KeyD' },
    { en: 'f', enShift: 'F', uk: 'а', ukShift: 'А', code: 'KeyF' },
    { en: 'g', enShift: 'G', uk: 'п', ukShift: 'П', code: 'KeyG' },
    { en: 'h', enShift: 'H', uk: 'р', ukShift: 'Р', code: 'KeyH' },
    { en: 'j', enShift: 'J', uk: 'о', ukShift: 'О', code: 'KeyJ' },
    { en: 'k', enShift: 'K', uk: 'л', ukShift: 'Л', code: 'KeyK' },
    { en: 'l', enShift: 'L', uk: 'д', ukShift: 'Д', code: 'KeyL' },
    { en: ';', enShift: ':', uk: 'ж', ukShift: 'Ж', code: 'Semicolon' },
    { en: "'", enShift: '"', uk: 'є', ukShift: 'Є', code: 'Quote' },
  ],
  // Row 3: Bottom letter row
  [
    { en: 'z', enShift: 'Z', uk: 'я', ukShift: 'Я', code: 'KeyZ' },
    { en: 'x', enShift: 'X', uk: 'ч', ukShift: 'Ч', code: 'KeyX' },
    { en: 'c', enShift: 'C', uk: 'с', ukShift: 'С', code: 'KeyC' },
    { en: 'v', enShift: 'V', uk: 'м', ukShift: 'М', code: 'KeyV' },
    { en: 'b', enShift: 'B', uk: 'и', ukShift: 'И', code: 'KeyB' },
    { en: 'n', enShift: 'N', uk: 'т', ukShift: 'Т', code: 'KeyN' },
    { en: 'm', enShift: 'M', uk: 'ь', ukShift: 'Ь', code: 'KeyM' },
    { en: ',', enShift: '<', uk: 'б', ukShift: 'Б', code: 'Comma' },
    { en: '.', enShift: '>', uk: 'ю', ukShift: 'Ю', code: 'Period' },
    { en: '/', enShift: '?', uk: '.', ukShift: ',', code: 'Slash' },
  ],
];
