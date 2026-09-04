// Unicode Indic Transliterator (Devanagari <-> Bengali)
function devanagariToBengali(text) {
  // Direct Devanagari to Bengali mapping
  // Unicode Devanagari base: 0x0900, Bengali base: 0x0980 (offset +0x80)
  const specialMap = {
    '़': '়', // Nukta
    '।': '।', // Danda stays same
    '॥': '॥',
    'य़': 'য়', // ya + nukta -> bengali ya
    'ड़': 'ড়',
    'ढ़': 'ঢ়',
  };

  let res = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    // Devanagari range: 0x0901 to 0x0963
    if (code >= 0x0901 && code <= 0x0970) {
      // Map to Bengali (+0x80)
      const bengaliCode = code + 0x80;
      // Bengali doesn't have some Vedic / specific chars, but standard Indic chars map 1:1
      res += String.fromCharCode(bengaliCode);
    } else {
      res += ch;
    }
  }

  // Clean up composite characters
  return res
    .replace(/দয\u09BCা/g, 'দয়া')
    .replace(/নিয়\u09BCে/g, 'নিয়ে')
    .replace(/য\u09BC/g, 'য়')
    .replace(/ড\u09BC/g, 'ড়')
    .replace(/ঢ\u09BC/g, 'ঢ়')
    .replace(/র\u09BC/g, 'র')
    .replace(/ব\u09BC/g, 'ব');
}

function bengaliToDevanagari(text) {
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    // Bengali range: 0x0981 to 0x09F0
    if (code >= 0x0981 && code <= 0x09F0) {
      const devaCode = code - 0x80;
      res += String.fromCharCode(devaCode);
    } else {
      res += ch;
    }
  }
  return res
    .replace(/य\u093C/g, 'य़')
    .replace(/ड\u093C/g, 'ड़')
    .replace(/ढ\u093C/g, 'ढ़');
}

const rawBengaliInDeva = "दय़ा करे घरे दुइ काप चा निय़े आसुन ।";
console.log('Bengali Output:', devanagariToBengali(rawBengaliInDeva));

const userBengaliInput = "দয়া করে ঘরে দুই কাপ চা নিয়ে আসুন।";
console.log('Bengali Input in Deva:', bengaliToDevanagari(userBengaliInput));
