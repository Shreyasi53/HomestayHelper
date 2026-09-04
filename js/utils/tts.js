// Text-To-Speech & Audio Engine for Homestay Communicator
class AudioTTS {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    if (this.synth) {
      this._loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this._loadVoices();
      }
    }
  }

  _loadVoices() {
    this.voices = this.synth.getVoices();
  }

  speak(text, lang = 'en-US', onStart = null, onEnd = null) {
    if (!this.synth) {
      alert("Speech Synthesis is not supported in this browser. Please read the card aloud.");
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    // Map language codes
    let langCode = 'en-US';
    if (lang === 'hi' || lang === 'ne') langCode = 'hi-IN'; // Fallback for Nepali/Hindi
    else if (lang === 'bn') langCode = 'bn-IN';
    else if (lang === 'en') langCode = 'en-IN';

    utterance.lang = langCode;

    // Pick best matching voice
    const matchedVoice = this.voices.find(v => v.lang.includes(langCode) || v.lang.startsWith(langCode.substring(0, 2)));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = (err) => {
      console.warn("TTS Error:", err);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) this.synth.cancel();
  }
}

window.appTTS = new AudioTTS();
