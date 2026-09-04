import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const BASE_URL = 'https://huggingface.co';

const EN_INDIC_REPO = 'hari31416/indictrans2-en-indic-dist-200M-ONNX-int8';
const INDIC_EN_REPO = 'hari31416/indictrans2-indic-en-dist-200M-ONNX-int8';

const FILES_TO_DOWNLOAD = [
  'config.json',
  'generation_config.json',
  'tokenizer_config.json',
  'tokenizer_meta.json',
  'tokenizer_src.json',
  'tokenizer_tgt.json',
  'encoder_model.onnx',
  'encoder_model.onnx.data',
  'decoder_model.onnx',
  'decoder_with_past_model.onnx',
  'decoder_shared.onnx.data'
];

async function downloadFile(repo, filename, destDir) {
  const destPath = path.join(destDir, filename);
  if (fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    if (stat.size > 0) {
      console.log(`[SKIP] ${filename} already exists (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
      return;
    }
  }

  const url = `${BASE_URL}/${repo}/resolve/main/${filename}`;
  console.log(`[DOWNLOADING] ${filename} from ${url}...`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  const fileStream = fs.createWriteStream(destPath);
  await pipeline(Readable.fromWeb(res.body), fileStream);
  const finalStat = fs.statSync(destPath);
  console.log(`[DONE] ${filename} (${(finalStat.size / 1024 / 1024).toFixed(2)} MB)`);
}

async function main() {
  const enIndicDir = path.resolve('public/models/indictrans2-en-indic');
  const indicEnDir = path.resolve('public/models/indictrans2-indic-en');

  fs.mkdirSync(enIndicDir, { recursive: true });
  fs.mkdirSync(indicEnDir, { recursive: true });

  console.log('--- Downloading en-indic model files ---');
  for (const file of FILES_TO_DOWNLOAD) {
    await downloadFile(EN_INDIC_REPO, file, enIndicDir);
  }

  console.log('\n--- Downloading indic-en model files ---');
  for (const file of FILES_TO_DOWNLOAD) {
    await downloadFile(INDIC_EN_REPO, file, indicEnDir);
  }

  console.log('\nAll model files downloaded successfully!');
}

main().catch(err => {
  console.error('Download error:', err);
  process.exit(1);
});
