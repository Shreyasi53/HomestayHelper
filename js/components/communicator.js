// Component 1: Zero-Bars Guest Communicator & Phrasebook UI
class CommunicatorComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.phrases = window.HOMESTAY_PHRASES || [];
    this.selectedCategory = 'all';
    this.guestLang = 'en'; // Default guest language: English
    this.activeSpeakingId = null;
  }

  render() {
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title">
          <span>🗣️ Zero-Bars Guest Communicator</span>
          <span class="phrase-badge">100% Offline Audio</span>
        </div>
        <p class="card-subtitle">Two-way phrasebook for tea garden homestays. Tap 🔊 to speak aloud in guest language.</p>

        <!-- Language Controls Bar -->
        <div class="lang-selector-bar">
          <div class="lang-select-group">
            <label>Guest Language:</label>
            <select id="guestLangSelect" class="form-select" style="width: auto; font-weight:600;">
              <option value="en" selected>English 🇬🇧</option>
              <option value="hi">Hindi (हिंदी) 🇮🇳</option>
              <option value="bn">Bengali (বাংলা) 🇮🇳</option>
              <option value="ne">Nepali (नेपाली) 🇳🇵</option>
            </select>
          </div>
          <div class="form-group" style="margin:0; flex:1; max-width:280px;">
            <input type="text" id="phraseSearchInput" class="form-control" placeholder="🔍 Search phrases (tea, key, rate)...">
          </div>
        </div>

        <!-- Category Pills -->
        <div class="category-pills">
          <button class="pill-btn ${this.selectedCategory === 'all' ? 'active' : ''}" data-cat="all">🌟 All Phrases</button>
          <button class="pill-btn ${this.selectedCategory === 'arrival' ? 'active' : ''}" data-cat="arrival">🛏 Arrival & Room</button>
          <button class="pill-btn ${this.selectedCategory === 'meals' ? 'active' : ''}" data-cat="meals">🍲 Meals & Tea</button>
          <button class="pill-btn ${this.selectedCategory === 'payments' ? 'active' : ''}" data-cat="payments">💵 Rates & Cash</button>
          <button class="pill-btn ${this.selectedCategory === 'transport' ? 'active' : ''}" data-cat="transport">🚘 Travel & Sights</button>
        </div>

        <!-- Phrase Cards Container -->
        <div id="phrasesListContainer"></div>

        <!-- Quick Phrase Builder -->
        <div class="ai-translator-box" style="margin-top: 1.5rem;">
          <h3>✨ Instant Homestay Message Helper</h3>
          <p style="font-size:0.85rem; opacity:0.9;">Type a custom message for your guest to speak out loud:</p>
          <div class="ai-input-group">
            <input type="text" id="customPhraseInput" placeholder="e.g. Please leave your shoes at the entrance door...">
            <button id="btnCustomSpeak" class="btn btn-accent btn-sm">🔊 Speak Aloud</button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
    this.renderPhrases();
  }

  renderPhrases() {
    const searchVal = (document.getElementById('phraseSearchInput')?.value || '').toLowerCase();
    const listContainer = document.getElementById('phrasesListContainer');

    const filtered = this.phrases.filter(p => {
      const matchCat = this.selectedCategory === 'all' || p.category === this.selectedCategory;
      const matchSearch = !searchVal || 
        p.en.toLowerCase().includes(searchVal) ||
        p.ne.toLowerCase().includes(searchVal) ||
        (p.ne_trans && p.ne_trans.toLowerCase().includes(searchVal));
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--text-muted);">
          <p>No matching phrases found.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(p => {
      const guestText = p[this.guestLang] || p.en;
      const isSpeaking = this.activeSpeakingId === p.id;

      return `
        <div class="phrase-card" id="card_${p.id}">
          <div class="phrase-header">
            <span class="phrase-badge">${p.category}</span>
            <span class="phrase-text-translit">${p.ne_trans || ''}</span>
          </div>
          <div class="phrase-text-host">${p.ne}</div>
          <div class="phrase-text-guest">
            <strong>[${this.guestLang.toUpperCase()}]:</strong> ${guestText}
          </div>
          <div class="phrase-actions">
            <button class="btn-speak ${isSpeaking ? 'playing' : ''}" onclick="appCommunicator.speakPhrase('${p.id}')">
              ${isSpeaking ? '🔊 Speaking...' : '🔊 Speak Guest Text'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  speakPhrase(phraseId) {
    const phrase = this.phrases.find(p => p.id === phraseId);
    if (!phrase) return;

    const textToSpeak = phrase[this.guestLang] || phrase.en;
    this.activeSpeakingId = phraseId;
    this.renderPhrases();

    window.appTTS.speak(
      textToSpeak,
      this.guestLang,
      () => {
        this.activeSpeakingId = phraseId;
        this.renderPhrases();
      },
      () => {
        this.activeSpeakingId = null;
        this.renderPhrases();
      }
    );
  }

  _bindEvents() {
    // Language dropdown change
    const langSelect = document.getElementById('guestLangSelect');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        this.guestLang = e.target.value;
        this.renderPhrases();
      });
    }

    // Search input
    const searchInput = document.getElementById('phraseSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderPhrases());
    }

    // Category pills
    const pillBtns = this.container.querySelectorAll('.pill-btn');
    pillBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        pillBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedCategory = e.target.getAttribute('data-cat');
        this.renderPhrases();
      });
    });

    // Custom phrase speak button
    const btnCustom = document.getElementById('btnCustomSpeak');
    const inputCustom = document.getElementById('customPhraseInput');
    if (btnCustom && inputCustom) {
      btnCustom.addEventListener('click', () => {
        const val = inputCustom.value.trim();
        if (!val) return;
        window.appTTS.speak(val, this.guestLang);
      });
    }
  }
}

window.CommunicatorComponent = CommunicatorComponent;
