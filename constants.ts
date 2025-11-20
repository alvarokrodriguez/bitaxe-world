
import type { Miner } from './types';

export const MINERS: Miner[] = [
  {
    id: 1,
    name: 'Bitaxe',
    model: 'Ultra',
    imageUrl: 'https://i.imgur.com/PKZJj9o.png',
    hashrate: 0.5,
    power: 10,
    efficiency: 20,
    price: 109,
    originalPrice: 139,
    profitability: 0.04,
  },
  {
    id: 2,
    name: 'Bitaxe',
    model: 'Supra',
    imageUrl: 'https://i.imgur.com/PKZJj9o.png',
    hashrate: 0.7,
    power: 12,
    efficiency: 17.1,
    price: 69,
    originalPrice: 159,
    profitability: 0.06,
  },
  {
    id: 3,
    name: 'Bitaxe',
    model: 'Gamma',
    imageUrl: 'https://i.imgur.com/PKZJj9o.png',
    hashrate: 1.2,
    power: 18,
    efficiency: 15,
    price: 104.98,
    originalPrice: 190,
    profitability: 0.1,
  },
  {
    id: 4,
    name: 'Nerdaxe',
    model: 'Gamma',
    imageUrl: 'https://i.imgur.com/8QxXwDC.png',
    hashrate: 1.2,
    power: 18,
    efficiency: 15,
    price: 155,
    originalPrice: 185,
    profitability: 0.1,
  },
  {
    id: 5,
    name: 'Bitaxe',
    model: 'Gamma Turbo',
    imageUrl: 'https://i.imgur.com/YeuQadF.png',
    hashrate: 2.5,
    power: 36,
    efficiency: 14.4,
    price: 219,
    originalPrice: 259,
    profitability: 0.2,
  },
  {
    id: 6,
    name: 'NerdQaxe',
    model: 'NerdQaxe++',
    imageUrl: 'https://bitronics.store/storage/2025/05/FOTOS-WEB-29.png',
    hashrate: 4.8,
    power: 77,
    efficiency: 16.0, 
    price: 399,
    originalPrice: 450,
    profitability: 0.4,
  },
  {
    id: 7,
    name: 'NERDOCTAXE',
    model: 'NerdOctaxe rev3.1',
    imageUrl: 'https://i.imgur.com/lGzn6g5.png',
    hashrate: 12,
    power: 200,
    efficiency: 16.6,
    price: 450,
    originalPrice: 500,
    profitability: 1.1,
  },
];

export const MAX_STATS = {
    hashrate: 12, 
    power: 300,   
    efficiency: 40, 
    profitability: 2, 
}

// Network Stats for Calculations
export const NETWORK_REWARD_BTC_DAY = 450; // Fixed reward + fees
export const SATS_PER_BTC = 100_000_000;
// Fallback Network Hashrate (approx 750 EH/s expressed in TH/s) just in case API fails
export const FALLBACK_NETWORK_HASHRATE = 750 * 1_000_000; 

export const LOADING_TIPS: string[] = [
    "> Initializing HashNet Protocol...",
    "> Did you know? TH/s means Terrahashes per second.",
    "> Fact: Satoshi Nakamoto is the anonymous creator of Bitcoin.",
    "> Loading Miner Profiles...",
    "> A 'block' in the blockchain is like a page in a ledger.",
    "> Verifying Blockchain Integrity...",
    "> Efficiency (J/TH) is key: lower is better!",
    "> Fact: The term 'Cyberspace' was coined by William Gibson.",
    "> System Ready. Granting Access...",
];
