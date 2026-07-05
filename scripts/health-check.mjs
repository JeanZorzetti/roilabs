#!/usr/bin/env node
// Read-only smoke check: GET a few production URLs and print status + latency.
import { pathToFileURL } from 'node:url';

const URLS = [
  'https://roilabs.com.br',
  'https://app.roilabs.com.br/api/cadeiras',
  'https://app.roilabs.com.br/api/health',
];

export async function checkUrl(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'GET' });
    return { method: 'GET', url, status: res.status, ms: Date.now() - start };
  } catch (err) {
    return { method: 'GET', url, status: `ERROR: ${err.message}`, ms: Date.now() - start };
  }
}

export { URLS };

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const url of URLS) {
    const { method, status, ms } = await checkUrl(url);
    console.log(`${method} ${url} -> ${status} (${ms}ms)`);
  }
}
