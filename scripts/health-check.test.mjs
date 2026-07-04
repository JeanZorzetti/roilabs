import assert from 'node:assert';
import { URLS } from './health-check.mjs';

assert.deepStrictEqual(URLS, [
  'https://roilabs.com.br',
  'https://app.roilabs.com.br/api/cadeiras',
  'https://app.roilabs.com.br/api/health',
]);

console.log('ok: health-check.test.mjs passed');
