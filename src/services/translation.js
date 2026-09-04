/**
 * Translation Service
 * Communicates with Web Worker for local AI translation.
 * Keeps all model-loading and worker coordination outside of React UI components.
 */

class TranslationService {
  constructor() {
    this.worker = null;
    this.pendingRequests = new Map();
    this.requestIdCounter = 0;
    this.statusListeners = new Set();
    this.currentStatus = {
      status: 'UNAVAILABLE',
      message: 'Local AI translation model is not available yet.'
    };

    this.initWorker();
  }

  initWorker() {
    if (typeof window === 'undefined') return;

    try {
      this.worker = new Worker(
        new URL('../workers/translation-worker.js', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e) => {
        const { id, action, status, message, success, error, translatedText } = e.data || {};

        if (action === 'INIT' || action === 'CHECK_STATUS') {
          this.currentStatus = { status, message };
          this.notifyStatusListeners();
        }

        if (id && this.pendingRequests.has(id)) {
          const { resolve, reject } = this.pendingRequests.get(id);
          this.pendingRequests.delete(id);

          if (success !== false) {
            resolve({
              success: true,
              translatedText,
              status,
              message
            });
          } else {
            reject(new Error(error || 'Translation request failed'));
          }
        }
      };

      this.worker.onerror = (err) => {
        console.error('Translation Worker Error:', err);
        this.currentStatus = {
          status: 'UNAVAILABLE',
          message: 'Local AI translation worker encountered an error.'
        };
        this.notifyStatusListeners();
      };

      // Check initial status
      this.checkStatus();
    } catch (err) {
      console.warn('Failed to initialize Translation Worker:', err);
      this.currentStatus = {
        status: 'UNAVAILABLE',
        message: 'Web Worker not supported or failed to initialize.'
      };
    }
  }

  checkStatus() {
    if (!this.worker) return;
    const id = ++this.requestIdCounter;
    this.worker.postMessage({
      id,
      action: 'CHECK_STATUS'
    });
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.currentStatus);
    return () => this.statusListeners.delete(callback);
  }

  notifyStatusListeners() {
    this.statusListeners.forEach((callback) => {
      try {
        callback(this.currentStatus);
      } catch (err) {
        console.error('Status listener error:', err);
      }
    });
  }

  /**
   * Main translation method
   * @param {string} text - Input text to translate
   * @param {string} sourceLanguage - e.g., 'en', 'hi', 'bn', 'ne'
   * @param {string} targetLanguage - e.g., 'en', 'hi', 'bn', 'ne'
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, sourceLanguage, targetLanguage) {
    if (!text || !text.trim()) {
      throw new Error('Input text is empty');
    }

    if (sourceLanguage === targetLanguage) {
      return text.trim();
    }

    if (!this.worker) {
      throw new Error('Local AI translation model is not available yet.');
    }

    return new Promise((resolve, reject) => {
      const id = ++this.requestIdCounter;
      this.pendingRequests.set(id, {
        resolve: (result) => resolve(result.translatedText),
        reject
      });

      this.worker.postMessage({
        id,
        action: 'TRANSLATE',
        text: text.trim(),
        sourceLanguage,
        targetLanguage
      });
    });
  }
}

export const translationService = new TranslationService();
