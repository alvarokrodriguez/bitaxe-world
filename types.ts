
export interface Miner {
  id: number;
  name: string;
  model: string;
  imageUrl: string;
  hashrate: number; // in TH/s
  power: number; // in Watts
  efficiency: number; // in J/TH
  price: number; // in USD
  originalPrice: number; // in USD
  profitability: number; // in USD/day
}