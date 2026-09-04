/**
 * On-Device Gemma AI Service for Homestay Helper
 * Connects directly to local Ollama runtime running Gemma 4 E2B (gemma4:e2b)
 * 100% Offline, Zero Cloud APIs.
 */

const MODEL_NAME = 'gemma4:e2b';

class HomestayAI {
  constructor() {
    this.modelName = MODEL_NAME;
    this.status = 'checking'; // 'checking' | 'ready' | 'generating' | 'offline' | 'unavailable' | 'error'
    this.statusListeners = new Set();
    this.lastError = null;
  }

  /**
   * Subscribe to AI engine status updates
   */
  subscribeStatus(listener) {
    this.statusListeners.add(listener);
    listener(this.status, this.lastError);
    return () => this.statusListeners.delete(listener);
  }

  _setStatus(status, error = null) {
    this.status = status;
    this.lastError = error;
    this.statusListeners.forEach((fn) => {
      try {
        fn(status, error);
      } catch (err) {
        console.error('[AI] Error in status listener:', err);
      }
    });
  }

  /**
   * Tries to fetch from Vite proxy first, falling back to direct localhost URL if needed
   */
  async _fetchOllama(endpoint, options = {}) {
    const urls = [
      `/api/ollama${endpoint}`,
      `http://127.0.0.1:11434${endpoint}`
    ];

    let lastFetchError = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, options);
        if (res.ok) {
          return res;
        }
      } catch (err) {
        lastFetchError = err;
      }
    }
    throw lastFetchError || new Error(`Failed to reach Ollama endpoint ${endpoint}`);
  }

  /**
   * Checks whether Ollama is active and if the gemma4:e2b model is available locally.
   * Returns: 'ready' | 'offline' | 'unavailable'
   */
  async checkEngineStatus() {
    try {
      this._setStatus(this.status === 'generating' ? 'generating' : 'checking');
      const res = await this._fetchOllama('/api/tags', { method: 'GET' });
      const data = await res.json();
      
      const models = data.models || [];
      const hasGemma = models.some((m) => {
        const name = (m.name || m.model || '').toLowerCase();
        return name === MODEL_NAME || name.startsWith('gemma4:e2b');
      });

      if (hasGemma) {
        this._setStatus('ready');
        return 'ready';
      } else {
        const err = `Ollama is running, but model "${MODEL_NAME}" is missing.`;
        this._setStatus('unavailable', err);
        return 'unavailable';
      }
    } catch (err) {
      const errMsg = 'Ollama is offline or unreachable on http://127.0.0.1:11434';
      this._setStatus('offline', errMsg);
      return 'offline';
    }
  }

  /**
   * Builds the strict, grounded listing generation prompt for Gemma
   */
  _buildPrompt(profile) {
    const {
      name = '',
      hostName = '',
      village = '',
      roomType = 'attached_bath',
      roomCount = 1,
      amenities = []
    } = profile;

    const roomTypeLabel = {
      attached_bath: 'Standard Attached Bath Room',
      shared_bath: 'Traditional Shared Bath Room',
      family_suite: 'Family Suite (4 Bed)'
    }[roomType] || roomType;

    const amenitiesList = amenities.length > 0
      ? amenities.join(', ')
      : 'Basic authentic hill hospitality';

    return `You are a helpful homestay listing writer.
Write an attractive, warm, and truthful homestay listing based ONLY on the verified details below.

Verified Homestay Profile:
- Homestay Name: ${name || 'Village Homestay'}
- Host Name(s): ${hostName || 'Local Host Family'}
- Village / Location: ${village || 'Darjeeling Hills'}
- Room Category: ${roomTypeLabel}
- Total Rooms Available: ${roomCount}
- Verified Amenities: ${amenitiesList}

Instructions & Constraints:
1. Use ONLY the information provided in the profile above.
2. Do NOT invent or assume extra amenities, facilities, distances, transportation, or views not explicitly listed.
3. Mention the tea garden or village setting only when supported by the location and amenities above.
4. Do NOT include pricing or rates (pricing is handled by a separate calculator).
5. Do NOT include meta-commentary like "Here is your listing" or "Hope this helps".
6. Format as a clean, polished listing description ready to share with prospective guests.`;
  }

  /**
   * Generates natural language homestay listing text using the local Gemma model.
   * 
   * @param {Object} profile - Homestay profile data
   * @returns {Promise<{ en: string }>} Generated listing object
   */
  async generateListingText(profile) {
    const prompt = this._buildPrompt(profile);
    this._setStatus('generating');

    try {
      const payload = {
        model: MODEL_NAME,
        prompt: prompt,
        stream: false
      };

      const res = await this._fetchOllama('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      let responseText = data.response || '';

      // If a thinking model outputs <think>...</think> tags, extract only final text
      responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      if (!responseText) {
        throw new Error('Gemma returned an empty response.');
      }

      this._setStatus('ready');
      return {
        en: responseText
      };
    } catch (err) {
      console.error('[AI] Gemma generation failed:', err);
      const isConnectionErr = err.message && (err.message.includes('fetch') || err.message.includes('reach'));
      const statusToSet = isConnectionErr ? 'offline' : 'error';
      this._setStatus(statusToSet, err.message);
      throw err;
    }
  }
}

export const homestayAI = new HomestayAI();
export default homestayAI;
