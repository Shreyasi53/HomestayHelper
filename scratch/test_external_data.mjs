import * as ort from 'onnxruntime-web/wasm';
import { env, PreTrainedTokenizer } from '@huggingface/transformers';
import fs from 'fs';
import path from 'path';

// Setup local offline configuration
env.allowLocalModels = true;
env.allowRemoteModels = false;

ort.env.wasm.wasmBinary = new Uint8Array(fs.readFileSync(path.resolve('public/wasm/ort-wasm-simd-threaded.wasm')));
ort.env.wasm.numThreads = 1;

async function testExternalDataSession() {
  const modelDir = path.resolve('public/models/indictrans2-en-indic');
  const encModelBuffer = fs.readFileSync(path.join(modelDir, 'encoder_model.onnx'));
  const encDataBuffer = fs.readFileSync(path.join(modelDir, 'encoder_model.onnx.data'));

  console.log('Testing encoder InferenceSession.create with externalData option...');
  const encSession = await ort.InferenceSession.create(new Uint8Array(encModelBuffer), {
    executionProviders: ['wasm'],
    externalData: [
      {
        path: 'encoder_model.onnx.data',
        data: new Uint8Array(encDataBuffer)
      }
    ]
  });
  console.log('Encoder session created successfully!', encSession.inputNames, encSession.outputNames);

  const decModelBuffer = fs.readFileSync(path.join(modelDir, 'decoder_model.onnx'));
  const decSharedBuffer = fs.readFileSync(path.join(modelDir, 'decoder_shared.onnx.data'));
  console.log('Testing decoder InferenceSession.create with externalData option...');
  const decSession = await ort.InferenceSession.create(new Uint8Array(decModelBuffer), {
    executionProviders: ['wasm'],
    externalData: [
      {
        path: 'decoder_shared.onnx.data',
        data: new Uint8Array(decSharedBuffer)
      }
    ]
  });
  console.log('Decoder session created successfully!', decSession.inputNames, decSession.outputNames);

  const decPastModelBuffer = fs.readFileSync(path.join(modelDir, 'decoder_with_past_model.onnx'));
  console.log('Testing decoder_with_past InferenceSession.create with externalData option...');
  const decPastSession = await ort.InferenceSession.create(new Uint8Array(decPastModelBuffer), {
    executionProviders: ['wasm'],
    externalData: [
      {
        path: 'decoder_shared.onnx.data',
        data: new Uint8Array(decSharedBuffer)
      }
    ]
  });
  console.log('Decoder with past session created successfully!', decPastSession.inputNames.length, decPastSession.outputNames.length);

  // Test running actual translation: English -> Hindi "hello dear"
  const tokenizerSrcJSON = JSON.parse(fs.readFileSync(path.join(modelDir, 'tokenizer_src.json'), 'utf-8'));
  const tokenizerTgtJSON = JSON.parse(fs.readFileSync(path.join(modelDir, 'tokenizer_tgt.json'), 'utf-8'));
  const tokenizerConfig = JSON.parse(fs.readFileSync(path.join(modelDir, 'tokenizer_config.json'), 'utf-8'));
  const genConfig = JSON.parse(fs.readFileSync(path.join(modelDir, 'generation_config.json'), 'utf-8'));
  const meta = JSON.parse(fs.readFileSync(path.join(modelDir, 'tokenizer_meta.json'), 'utf-8'));

  const srcTok = new PreTrainedTokenizer(tokenizerSrcJSON, tokenizerConfig);
  const tgtTok = new PreTrainedTokenizer(tokenizerTgtJSON, tokenizerConfig);

  const formattedInput = 'eng_Latn hin_Deva hello dear';
  const encTokens = srcTok(formattedInput);
  const inputIds = Array.from(encTokens.input_ids.data).map(x => BigInt(Number(x) < meta.src_dict_size ? Number(x) : meta.unk_id));
  const attnMask = Array.from(encTokens.attention_mask.data).map(x => BigInt(x));

  const encOut = await encSession.run({
    input_ids: new ort.Tensor('int64', BigInt64Array.from(inputIds), [1, inputIds.length]),
    attention_mask: new ort.Tensor('int64', BigInt64Array.from(attnMask), [1, attnMask.length])
  });

  const numLayers = (decSession.outputNames.length - 1) / 4;
  let decIn = new ort.Tensor('int64', new BigInt64Array([2n]), [1, 1]);
  let past = {};
  const genIds = [2];

  for (let s = 0; s < 32; s++) {
    const out = s === 0
      ? await decSession.run({
          input_ids: decIn,
          encoder_hidden_states: encOut.last_hidden_state,
          encoder_attention_mask: new ort.Tensor('int64', BigInt64Array.from(attnMask), [1, attnMask.length])
        })
      : await decPastSession.run({
          input_ids: decIn,
          encoder_attention_mask: new ort.Tensor('int64', BigInt64Array.from(attnMask), [1, attnMask.length]),
          ...past
        });

    const logits = out.logits.data;
    const vocab = out.logits.dims[2];
    let maxV = -Infinity, maxI = 0;
    for (let v = 0; v < vocab; v++) {
      if (logits[v] > maxV) {
        maxV = logits[v];
        maxI = v;
      }
    }
    genIds.push(maxI);
    if (maxI === 2) break;
    decIn = new ort.Tensor('int64', new BigInt64Array([BigInt(maxI)]), [1, 1]);
    past = {};
    for (let i = 0; i < numLayers; i++) {
      past[`past_key_values.${i}.decoder.key`] = out[`present.${i}.decoder.key`];
      past[`past_key_values.${i}.decoder.value`] = out[`present.${i}.decoder.value`];
      past[`past_key_values.${i}.encoder.key`] = out[`present.${i}.encoder.key`];
      past[`past_key_values.${i}.encoder.value`] = out[`present.${i}.encoder.value`];
    }
  }

  const res = tgtTok.decode(genIds, { skip_special_tokens: true });
  console.log('Result for "hello dear" (English -> Hindi):', res);
}

testExternalDataSession().catch(console.error);
