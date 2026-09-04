/**
 * Web Worker for Local IndicTrans2 AI Translation
 * Runs onnxruntime-web and Fast BPE Tokenizers entirely off the main UI thread.
 */

import * as ort from 'onnxruntime-web/wasm';
import { env, PreTrainedTokenizer } from '@huggingface/transformers';

// Configure Transformers.js for offline local models and static public WASM assets
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models';
if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = {
    wasm: '/wasm/ort-wasm-simd-threaded.wasm'
  };
  env.backends.onnx.wasm.numThreads = 1;
}

// Configure ONNX Runtime Web for local WASM execution without remote CDN requests
ort.env.wasm.wasmPaths = {
  wasm: '/wasm/ort-wasm-simd-threaded.wasm'
};
ort.env.wasm.numThreads = 1;

// Supported languages
const FLORES_CODES = {
  en: 'eng_Latn',
  hi: 'hin_Deva',
  bn: 'ben_Beng',
  ne: 'npi_Deva'
};

// Cached model state
let currentLoadedDirection = null; // 'en-indic' | 'indic-en' | null
let currentModel = null;
let isLoadingModel = false;

/**
 * Transliterate Devanagari Unicode characters to Bengali Unicode characters
 */
function devanagariToBengali(text) {
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    // Devanagari range: 0x0901 to 0x0970 (excluding danda 0x0964 & double danda 0x0965)
    if (code >= 0x0901 && code <= 0x0970 && code !== 0x0964 && code !== 0x0965) {
      res += String.fromCharCode(code + 0x80);
    } else {
      res += ch;
    }
  }
  return res
    .replace(/দয\u09BCা/g, 'দয়া')
    .replace(/নিয়\u09BCে/g, 'নিয়ে')
    .replace(/য\u09BC/g, 'য়')
    .replace(/ড\u09BC/g, 'ড়')
    .replace(/ঢ\u09BC/g, 'ঢ়')
    .replace(/র\u09BC/g, 'র')
    .replace(/ব\u09BC/g, 'ব');
}

/**
 * Transliterate Bengali Unicode characters to Devanagari Unicode characters
 */
function bengaliToDevanagari(text) {
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    // Bengali range: 0x0981 to 0x09F0 (excluding danda)
    if (code >= 0x0981 && code <= 0x09F0 && code !== 0x09E4 && code !== 0x09E5) {
      res += String.fromCharCode(code - 0x80);
    } else {
      res += ch;
    }
  }
  return res
    .replace(/য/g, 'य')
    .replace(/য়/g, 'य़')
    .replace(/ড়/g, 'ड़')
    .replace(/ঢ়/g, 'ढ़')
    .replace(/র/g, 'र');
}

/**
 * Release currently loaded model from memory
 */
function releaseCurrentModel() {
  if (currentModel) {
    try {
      if (currentModel.encSession) currentModel.encSession.release?.();
      if (currentModel.decSession) currentModel.decSession.release?.();
      if (currentModel.decPastSession) currentModel.decPastSession.release?.();
    } catch (e) {
      console.warn('Error releasing previous model session:', e);
    }
    currentModel = null;
    currentLoadedDirection = null;
  }
}

/**
 * Load direction model bundle (en-indic or indic-en)
 */
async function loadDirectionModel(direction, onProgress = null) {
  if (currentLoadedDirection === direction && currentModel) {
    return currentModel;
  }

  // Release previous model to conserve memory on low-end devices
  releaseCurrentModel();
  isLoadingModel = true;

  try {
    const modelBase = `/models/indictrans2-${direction}`;

    if (onProgress) onProgress({ status: 'LOADING', progress: 10, message: `Loading ${direction} configs & tokenizers...` });

    const [srcTokJSON, tgtTokJSON, tokConfig, genConfig, meta] = await Promise.all([
      fetch(`${modelBase}/tokenizer_src.json`).then(r => {
        if (!r.ok) throw new Error(`Model not installed (${r.status})`);
        return r.json();
      }),
      fetch(`${modelBase}/tokenizer_tgt.json`).then(r => r.json()),
      fetch(`${modelBase}/tokenizer_config.json`).then(r => r.json()),
      fetch(`${modelBase}/generation_config.json`).then(r => r.json()),
      fetch(`${modelBase}/tokenizer_meta.json`).then(r => r.json())
    ]);

    const srcTok = new PreTrainedTokenizer(srcTokJSON, tokConfig);
    const tgtTok = new PreTrainedTokenizer(tgtTokJSON, tokConfig);

    if (onProgress) onProgress({ status: 'LOADING', progress: 30, message: `Loading neural encoder weights...` });
    const [encModelBuffer, encDataBuffer] = await Promise.all([
      fetch(`${modelBase}/encoder_model.onnx`).then(r => r.arrayBuffer()),
      fetch(`${modelBase}/encoder_model.onnx.data`).then(r => r.arrayBuffer())
    ]);

    const encSession = await ort.InferenceSession.create(new Uint8Array(encModelBuffer), {
      executionProviders: ['wasm'],
      externalData: [
        {
          path: 'encoder_model.onnx.data',
          data: new Uint8Array(encDataBuffer)
        }
      ]
    });

    if (onProgress) onProgress({ status: 'LOADING', progress: 65, message: `Loading neural decoder weights...` });
    const [decModelBuffer, decPastModelBuffer, decSharedBuffer] = await Promise.all([
      fetch(`${modelBase}/decoder_model.onnx`).then(r => r.arrayBuffer()),
      fetch(`${modelBase}/decoder_with_past_model.onnx`).then(r => r.arrayBuffer()),
      fetch(`${modelBase}/decoder_shared.onnx.data`).then(r => r.arrayBuffer())
    ]);

    const decSharedUint8 = new Uint8Array(decSharedBuffer);

    const decSession = await ort.InferenceSession.create(new Uint8Array(decModelBuffer), {
      executionProviders: ['wasm'],
      externalData: [
        {
          path: 'decoder_shared.onnx.data',
          data: decSharedUint8
        }
      ]
    });

    if (onProgress) onProgress({ status: 'LOADING', progress: 90, message: `Initializing KV-cache decoder...` });
    const decPastSession = await ort.InferenceSession.create(new Uint8Array(decPastModelBuffer), {
      executionProviders: ['wasm'],
      externalData: [
        {
          path: 'decoder_shared.onnx.data',
          data: decSharedUint8
        }
      ]
    });

    const numLayers = (decSession.outputNames.length - 1) / 4;

    currentModel = {
      direction,
      srcTok,
      tgtTok,
      genConfig,
      meta,
      encSession,
      decSession,
      decPastSession,
      numLayers
    };
    currentLoadedDirection = direction;
    isLoadingModel = false;

    if (onProgress) onProgress({ status: 'READY', progress: 100, message: `Local AI Model Ready (${direction})` });
    return currentModel;
  } catch (err) {
    isLoadingModel = false;
    currentModel = null;
    currentLoadedDirection = null;
    throw err;
  }
}

/**
 * Execute translation with greedy decoding loop
 */
async function runTranslation(text, srcLangCode, tgtLangCode, model) {
  const { srcTok, tgtTok, genConfig, meta, encSession, decSession, decPastSession, numLayers } = model;

  let processedInput = text.trim();
  if (srcLangCode === 'ben_Beng') {
    processedInput = bengaliToDevanagari(processedInput);
  }

  const formattedInput = `${srcLangCode} ${tgtLangCode} ${processedInput}`;

  // Tokenize source sentence
  const encoded = srcTok(formattedInput);
  const inputIdsArray = Array.from(encoded.input_ids.data).map(x => {
    const num = Number(x);
    return num < meta.src_dict_size ? BigInt(num) : BigInt(meta.unk_id);
  });
  const attentionMaskArray = Array.from(encoded.attention_mask.data).map(x => BigInt(x));

  const seqLen = inputIdsArray.length;
  const inputIdsTensor = new ort.Tensor('int64', BigInt64Array.from(inputIdsArray), [1, seqLen]);
  const attentionMaskTensor = new ort.Tensor('int64', BigInt64Array.from(attentionMaskArray), [1, seqLen]);

  // Run Encoder
  const encOut = await encSession.run({
    input_ids: inputIdsTensor,
    attention_mask: attentionMaskTensor
  });
  const lastHiddenState = encOut.last_hidden_state;

  const decoderStartId = BigInt(genConfig.decoder_start_token_id ?? 2);
  const eosId = BigInt(genConfig.eos_token_id ?? 2);

  let decoderInputIds = new ort.Tensor('int64', new BigInt64Array([decoderStartId]), [1, 1]);
  let pastKeyValues = {};
  const generatedIds = [Number(decoderStartId)];

  // Greedy Decoding Loop
  const maxTokens = 128;
  for (let step = 0; step < maxTokens; step++) {
    let decOut;
    if (step === 0) {
      decOut = await decSession.run({
        input_ids: decoderInputIds,
        encoder_hidden_states: lastHiddenState,
        encoder_attention_mask: attentionMaskTensor
      });
    } else {
      decOut = await decPastSession.run({
        input_ids: decoderInputIds,
        encoder_attention_mask: attentionMaskTensor,
        ...pastKeyValues
      });
    }

    const logitsTensor = decOut.logits;
    const vocabSize = logitsTensor.dims[2];
    const logitsData = logitsTensor.data;
    const offset = (logitsTensor.dims[1] - 1) * vocabSize;

    let maxVal = -Infinity;
    let maxIdx = 0;
    for (let v = 0; v < vocabSize; v++) {
      const val = logitsData[offset + v];
      if (val > maxVal) {
        maxVal = val;
        maxIdx = v;
      }
    }

    generatedIds.push(maxIdx);
    if (BigInt(maxIdx) === eosId) {
      break;
    }

    decoderInputIds = new ort.Tensor('int64', new BigInt64Array([BigInt(maxIdx)]), [1, 1]);

    pastKeyValues = {};
    for (let i = 0; i < numLayers; i++) {
      pastKeyValues[`past_key_values.${i}.decoder.key`] = decOut[`present.${i}.decoder.key`];
      pastKeyValues[`past_key_values.${i}.decoder.value`] = decOut[`present.${i}.decoder.value`];
      pastKeyValues[`past_key_values.${i}.encoder.key`] = decOut[`present.${i}.encoder.key`];
      pastKeyValues[`past_key_values.${i}.encoder.value`] = decOut[`present.${i}.encoder.value`];
    }
  }

  // Decode tokens to target string
  const safeIds = generatedIds.map(id => id < meta.tgt_dict_size ? id : meta.unk_id);
  let decodedText = tgtTok.decode(safeIds, { skip_special_tokens: true });

  // Postprocess transliteration for Bengali
  if (tgtLangCode === 'ben_Beng') {
    decodedText = devanagariToBengali(decodedText);
  }

  return decodedText.trim();
}

// Handle messages from TranslationService
self.onmessage = async (event) => {
  const { id, type, action, text, sourceLanguage, targetLanguage } = event.data || {};
  const msgType = type || action;

  switch (msgType) {
    case 'CHECK_STATUS':
    case 'status': {
      self.postMessage({
        id,
        type: 'status',
        status: currentModel ? 'READY' : (isLoadingModel ? 'LOADING' : 'UNAVAILABLE'),
        message: currentModel ? `AI Ready (${currentLoadedDirection})` : 'Local AI translation ready to load on demand.'
      });
      break;
    }

    case 'TRANSLATE':
    case 'translate': {
      const srcFlores = FLORES_CODES[sourceLanguage] || sourceLanguage;
      const tgtFlores = FLORES_CODES[targetLanguage] || targetLanguage;

      if (!text || !text.trim()) {
        self.postMessage({
          id,
          type: 'error',
          success: false,
          error: 'Input text is empty'
        });
        return;
      }

      if (srcFlores === tgtFlores) {
        self.postMessage({
          id,
          type: 'result',
          success: true,
          translatedText: text.trim()
        });
        return;
      }

      // Check language direction
      let direction = null;
      if (srcFlores === 'eng_Latn') {
        direction = 'en-indic';
      } else if (tgtFlores === 'eng_Latn') {
        direction = 'indic-en';
      } else {
        self.postMessage({
          id,
          type: 'error',
          success: false,
          error: 'Direct Indic-to-Indic translation is not enabled yet.'
        });
        return;
      }

      try {
        self.postMessage({
          id,
          type: 'status',
          status: 'LOADING',
          message: `Preparing local ${direction} neural model...`
        });

        const model = await loadDirectionModel(direction, (progressState) => {
          self.postMessage({
            id,
            type: 'status',
            ...progressState
          });
        });

        self.postMessage({
          id,
          type: 'status',
          status: 'TRANSLATING',
          message: 'Translating with local neural model...'
        });

        const translatedText = await runTranslation(text, srcFlores, tgtFlores, model);

        self.postMessage({
          id,
          type: 'result',
          success: true,
          translatedText
        });
      } catch (err) {
        console.error('Translation error in worker:', err);
        const errMsg = err.message?.includes('Model not installed') || err.message?.includes('404')
          ? 'Local translation model is not installed.'
          : (err.message || 'Translation failed');

        self.postMessage({
          id,
          type: 'error',
          success: false,
          error: errMsg
        });
      }
      break;
    }

    case 'RELEASE':
    case 'release': {
      releaseCurrentModel();
      self.postMessage({
        id,
        type: 'status',
        status: 'UNAVAILABLE',
        message: 'Model unloaded to free memory.'
      });
      break;
    }

    default:
      self.postMessage({
        id,
        type: 'error',
        success: false,
        error: `Unknown message type: ${msgType}`
      });
      break;
  }
};
