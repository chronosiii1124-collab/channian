import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist-public');
const full = path.join(dist, 'data.json');
const sample = path.join(dist, 'data.sample.json');

if (!fs.existsSync(sample)) {
  throw new Error('dist-public/data.sample.json is missing; public build aborted');
}
if (fs.existsSync(full)) {
  fs.rmSync(full);
  console.log('removed dist-public/data.json (full private dataset)');
}
