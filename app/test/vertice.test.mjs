// Autotestes das regras da Vértice (preço, contrato, termo de entrega). Cada
// módulo exporta um `check()` que lança no primeiro cenário que falhar.
import { check as checkQuote } from '../src/lib/vertice/quote.ts';
import { check as checkContract } from '../src/lib/vertice/contract.ts';
import { check as checkDelivery } from '../src/lib/vertice/delivery.ts';

checkQuote();
checkContract();
checkDelivery();

console.log('vertice.test.mjs: all assertions passed');
