// Text-To-Speech & Audio Engine for Homestay Communicator
class AudioTTS {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    if (this.synth) {
      this._loadVoices();
      if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this._loadVoices();
      }
    }
  }

  _loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  speak(text, lang = 'en', onStart = null, onEnd = null) {
    if (!this.synth) {
      alert("Speech Synthesis is not supported in this browser. Please read the card aloud.");
      if (onEnd) onEnd();
      return;
    }

    if (!text || !text.trim()) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    // Standard language code mappings
    const LANG_MAP = {
      en: 'en-IN',
      hi: 'hi-IN',
      bn: 'bn-IN',
      ne: 'ne-NP'
    };

    const targetCode = LANG_MAP[lang] || lang;
    utterance.lang = targetCode;

    if (this.voices.length === 0) {
      this._loadVoices();
    }

    // Match exact voice or prefix, with graceful fallback for Indic scripts
    let matchedVoice = this.voices.find(v => v.lang === targetCode || v.lang.replace('_', '-') === targetCode);
    if (!matchedVoice) {
      matchedVoice = this.voices.find(v => v.lang.startsWith(targetCode.substring(0, 2)));
    }
    // Nepali fallback to Hindi voice if ne-NP voice is not installed in OS
    if (!matchedVoice && targetCode === 'ne-NP') {
      matchedVoice = this.voices.find(v => v.lang.startsWith('hi'));
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = (err) => {
      console.warn("[TTS] Speech synthesis notice/error:", err);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) this.synth.cancel();
  }
}

export const appTTS = new AudioTTS();
export const ttsService = appTTS;
export default appTTS;
