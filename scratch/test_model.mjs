import { PreTrainedTokenizer } from '@huggingface/transformers';
import * as ort from 'onnxruntime-node';
import fs from 'fs';
import path from 'path';

async function testTranslation() {
  const modelDir = path.resolve('public/models/indictrans2-en-indic');
  const tokenizerSrcJSON = JSON.parse(fs.readFileSync(path.join(modelDir, 'tokenizer_src.json'), 'utf-8'));
  const tokenizerTgtJSON = JSON.parse(fs.readFileSync(path.join(modelDir, 'tokenizer_tgt.json'), 'utf-8'));
  const tokenizerConfig = JSON.parse(fs.readFileSync(path.join(modelDir, 'tokenizer_config.json'), 'utf-8'));
  const genConfig = JSON.parse(fs.readFileSync(path.join(modelDir, 'generation_config.json'), 'utf-8'));
  const meta = JSON.parse(fs.readFileSync(path.join(modelDir, 'tokenizer_meta.json'), 'utf-8'));

  const srcTok = new PreTrainedTokenizer(tokenizerSrcJSON, tokenizerConfig);
  const tgtTok = new PreTrainedTokenizer(tokenizerTgtJSON, tokenizerConfig);

  console.log('Loading ONNX sessions...');
  const encSession = await ort.InferenceSession.create(path.join(modelDir, 'encoder_model.onnx'));
  const decSession = await ort.InferenceSession.create(path.join(modelDir, 'decoder_model.onnx'));
  const decPastSession = await ort.InferenceSession.create(path.join(modelDir, 'decoder_with_past_model.onnx'));
  console.log('ONNX sessions loaded successfully!');

  const numLayers = (decSession.outputNames.length - 1) / 4;
  console.log('Num transformer layers:', numLayers);

  async function translate(text, srcLang, tgtLang) {
    const formattedInput = `${srcLang} ${tgtLang} ${text}`;
    console.log('\nTranslating:', formattedInput);

    const encoded = srcTok(formattedInput);
    const inputIdsArray = Array.from(encoded.input_ids.data).map(x => {
      const num = Number(x);
      return num < meta.src_dict_size ? BigInt(num) : BigInt(meta.unk_id);
    });
    const attentionMaskArray = Array.from(encoded.attention_mask.data).map(x => BigInt(x));

    const seqLen = inputIdsArray.length;
    const inputIdsTensor = new ort.Tensor('int64', BigInt64Array.from(inputIdsArray), [1, seqLen]);
    const attentionMaskTensor = new ort.Tensor('int64', BigInt64Array.from(attentionMaskArray), [1, seqLen]);

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

    for (let step = 0; step < 128; step++) {
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

    const safeIds = generatedIds.map(id => id < meta.tgt_dict_size ? id : meta.unk_id);
    const decoded = tgtTok.decode(safeIds, { skip_special_tokens: true });
    return decoded;
  }

  const resHindi = await translate('Please bring two cups of tea to the room.', 'eng_Latn', 'hin_Deva');
  console.log('Result Hindi:', resHindi);

  const resNepali = await translate('Please bring two cups of tea to the room.', 'eng_Latn', 'npi_Deva');
  console.log('Result Nepali:', resNepali);

  const resBengali = await translate('Please bring two cups of tea to the room.', 'eng_Latn', 'ben_Beng');
  console.log('Result Bengali:', resBengali);
}

testTranslation().catch(console.error);
