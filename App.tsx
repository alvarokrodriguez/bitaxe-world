
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MINERS, MAX_STATS, LOADING_TIPS, NETWORK_REWARD_BTC_DAY, SATS_PER_BTC, FALLBACK_NETWORK_HASHRATE } from './constants';
import type { Miner } from './types';
import { StatBar } from './components/StatBar';
import LetterGlitch from './components/LetterGlitch';
import DecryptedText from './components/DecryptedText';

const ANIMATION_DURATION = 500; // ms
const LOADING_DURATION = 3000; // ms

// *** CONFIGURACIÓN DE DONACIÓN ***
// PON TU DIRECCIÓN LIGHTNING AQUÍ (ej: usuario@walletofsatoshi.com o un código LNURL)
const LIGHTNING_ADDRESS = "lesserrailway35@walletofsatoshi.com"; 

// --- NEW COMPONENT: Animated Number Counter ---
const AnimatedNumber: React.FC<{ value: number; decimals?: number; prefix?: string }> = ({ value, decimals = 0, prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const startValue = useRef(value);
  const startTime = useRef(0);
  const rafId = useRef<number>(0);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    startValue.current = displayValue;
    startTime.current = performance.now();
    const duration = 1000; // 1 second animation

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      // Calculate next value without rounding yet
      const nextValue = startValue.current + (value - startValue.current) * ease;
      
      setDisplayValue(nextValue);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId.current);
  }, [value]);

  return <>{prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
};

const CurrencyToggle: React.FC<{ currency: 'USD' | 'EUR'; onToggle: () => void; className?: string }> = ({ currency, onToggle, className = '' }) => {
    return (
        <button 
            onClick={onToggle}
            className={className}
        >
            <div className="relative overflow-hidden border border-amber-500/50 bg-black/80 backdrop-blur-md px-4 py-2 flex items-center gap-3 [clip-path:polygon(10%_0,100%_0,100%_80%,90%_100%,0_100%,0_20%)] transition-all duration-300 hover:border-amber-500 hover:shadow-[0_0_10px_rgba(247,147,26,0.3)]">
                 {/* Scanline effect */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(247,147,26,0.05)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                
                <span className={`font-orbitron font-bold text-sm transition-colors duration-300 ${currency === 'USD' ? 'text-amber-500 text-glow' : 'text-white'}`}>
                    USD
                </span>
                <div className="w-[1px] h-4 bg-amber-500/30 transform rotate-12"></div>
                <span className={`font-orbitron font-bold text-sm transition-colors duration-300 ${currency === 'EUR' ? 'text-amber-500 text-glow' : 'text-white'}`}>
                    EUR
                </span>

                {/* Glitch decorative elements */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500 opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500 opacity-50"></div>
            </div>
        </button>
    );
};

const ArrowButton: React.FC<{ direction: 'left' | 'right'; onClick: () => void; disabled: boolean }> = ({ direction, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`absolute top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm w-14 h-16 flex items-center justify-center text-amber-300 transition-all duration-300 z-20 disabled:opacity-50 disabled:cursor-not-allowed [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] hover:bg-orange-400/20 filter hover:drop-shadow-[0_0_8px_#f7931a] drop-shadow-[0_0_3px_#f7931a] ${direction === 'left' ? 'left-0 md:left-10' : 'right-0 md:right-10'}`}
    aria-label={direction === 'left' ? 'Previous miner' : 'Next miner'}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {direction === 'left' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      )}
    </svg>
  </button>
);

const PaginationDots: React.FC<{ total: number; current: number }> = ({ total, current }) => {
  return (
    <div className="hidden md:flex items-center justify-center gap-4 md:-mt-12 z-20 h-6">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`
            w-3 h-3 rotate-45 border border-amber-500/50 transform-gpu
            transition-all duration-300 ease-out
            ${index === current 
              ? 'bg-amber-500 scale-125 shadow-[0_0_10px_#f7931a]' 
              : 'bg-transparent opacity-50 hover:opacity-100 scale-100'}
          `}
        />
      ))}
    </div>
  );
};

// --- Donation Modal Component ---
const DonationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(LIGHTNING_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  if (!isOpen) return null;

  // Encode address for QR API (simple text encoding serves well for modern wallets scanning addresses)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=lightning:${encodeURIComponent(LIGHTNING_ADDRESS)}&bgcolor=000&color=f7931a&margin=10`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      
      <div className="relative bg-black/90 border border-amber-500/50 p-6 md:p-8 max-w-sm w-full shadow-[0_0_30px_rgba(247,147,26,0.2)] animate-fade-in-up [clip-path:polygon(5%_0,100%_0,100%_95%,95%_100%,0_100%,0_5%)]">
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold font-orbitron text-white text-glow uppercase tracking-wider">
            Fuel the Network
          </h3>
          
          <div className="flex justify-center relative group">
             <div className="absolute -inset-1 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg opacity-30 blur-md group-hover:opacity-50 transition-opacity"></div>
             <div className="relative bg-white p-2 rounded-sm">
                <img 
                  src={qrUrl} 
                  alt="Lightning QR" 
                  className="w-48 h-48 object-contain mix-blend-multiply" 
                />
             </div>
          </div>

          <div className="space-y-2">
             <p className="text-xs text-amber-500/80 font-mono uppercase tracking-widest">Lightning Address</p>
             <div 
                onClick={handleCopy}
                className="bg-slate-900/80 border border-amber-500/30 p-3 rounded flex items-center justify-between cursor-pointer hover:border-amber-500/80 transition-colors group"
             >
                <span className="text-gray-300 font-mono text-sm truncate mr-2 select-all">{LIGHTNING_ADDRESS}</span>
                <div className="text-amber-500">
                   {copied ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                   ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                     </svg>
                   )}
                </div>
             </div>
             <p className="text-[10px] text-gray-500 font-mono h-3">
               {copied ? "Address copied to clipboard!" : "Click to copy or scan QR"}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MinerDetailsProps {
    miner: Miner;
    networkHashrate: number;
    btcPrice: number;
    currency: 'USD' | 'EUR';
    eurRate: number;
    onToggleCurrency: () => void;
}

const MinerDetails: React.FC<MinerDetailsProps> = ({ miner, networkHashrate, btcPrice, currency, eurRate, onToggleCurrency }) => {
  const [timeFrame, setTimeFrame] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [rewardUnit, setRewardUnit] = useState<'sats' | 'fiat'>('sats');

  // Conversion Helper
  const convertFiat = (usdAmount: number) => {
      return currency === 'EUR' ? usdAmount * eurRate : usdAmount;
  };
  const currencySymbol = currency === 'EUR' ? '€' : '$';

  // Formula: Daily Sats = (Network Daily Reward in Sats) * (Miner Hashrate) / (Network Hashrate)
  const dailySats = Math.floor((NETWORK_REWARD_BTC_DAY * SATS_PER_BTC * miner.hashrate) / networkHashrate);
  
  // Calculate Daily Fiat (based on current Btc Price in USD)
  const dailyFiatRaw = (dailySats / SATS_PER_BTC) * btcPrice;
  const dailyFiat = convertFiat(dailyFiatRaw);

  // Calculate Block Reward (approximate based on daily network reward / 144 blocks)
  const blockRewardBtc = NETWORK_REWARD_BTC_DAY / 144;
  const blockRewardFiatRaw = blockRewardBtc * btcPrice;
  const blockRewardFiat = convertFiat(blockRewardFiatRaw);

  // Monthly consumption in kWh: (Power(W) * 24h * 30d) / 1000
  const monthlyKwh = (miner.power * 24 * 30) / 1000;

  // Prices
  const currentPrice = convertFiat(miner.price);
  const originalPrice = convertFiat(miner.originalPrice);


  // Calculate Probability 1 in X based on timeFrame
  let blocksPerPeriod = 144; // Daily default
  let timeFrameLabel = 'DAILY';

  if (timeFrame === 'monthly') {
      blocksPerPeriod = 144 * 30;
      timeFrameLabel = 'MONTHLY';
  } else if (timeFrame === 'yearly') {
      blocksPerPeriod = 144 * 365;
      timeFrameLabel = 'YEARLY';
  }

  // 1 in X = Network Hashrate / (Miner Hashrate * BlocksPerPeriod)
  const oneInXValue = networkHashrate / (miner.hashrate * blocksPerPeriod);

  const cycleTimeFrame = () => {
    setTimeFrame(prev => {
        if (prev === 'daily') return 'monthly';
        if (prev === 'monthly') return 'yearly';
        return 'daily';
    });
  };

  const toggleRewardUnit = () => {
    setRewardUnit(prev => prev === 'sats' ? 'fiat' : 'sats');
  };

  const handleBuyClick = () => {
    // Track 'InitiateCheckout' event with Meta Pixel
    if ((window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: `${miner.name} ${miner.model}`,
        content_id: miner.id,
        value: currentPrice,
        currency: currency,
        content_type: 'product'
      });
    }
    console.log('Tracked InitiateCheckout for:', miner.model);
  };

  return (
    <div className="w-full flex flex-col justify-center items-center">
      {/* Key on parent ensures title animates on change */}
      <div key={`title-${miner.id}`} className="text-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider uppercase font-orbitron text-glow">{miner.name}</h1>
          <h2 className="text-xl font-light text-orange-300 mb-8 font-orbitron tracking-wide">{miner.model}</h2>
      </div>

      <div className="space-y-4 w-full max-w-md mb-8">
        {/* Visible Stats - Removed keys so bars transition smoothly instead of resetting */}
        <StatBar label="Hashrate (TH/s)" value={miner.hashrate} maxValue={MAX_STATS.hashrate} />
        <StatBar label="Power Consumption (W)" value={miner.power} maxValue={MAX_STATS.power} />
        
        {/* Monthly kWh small text (pushes content down) */}
        <div className="w-full flex justify-end -mt-3 mb-8 pr-1 animate-fade-in">
           <span className="text-[10px] font-mono text-amber-400/60 tracking-wider">
               <AnimatedNumber value={monthlyKwh} decimals={1} prefix="≈ " /> kWh / Month
           </span>
        </div>
        
        {/* Daily Sats Calculation Display */}
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg blur-sm"></div>
            <div className="relative border border-amber-500/30 bg-black/60 rounded-lg flex justify-between items-center overflow-hidden h-28 pr-0">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_10px_#f7931a]"></div>
                
                <div className="flex flex-col z-10 p-4 flex-1">
                    <span className="text-xs text-amber-400/80 uppercase tracking-[0.2em] font-orbitron">Est. Daily Reward</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        {/* Animated Number for Sats/USD */}
                        <span className="text-3xl md:text-4xl font-bold text-white text-glow font-orbitron">
                          {rewardUnit === 'sats' ? (
                            <AnimatedNumber value={dailySats} />
                          ) : (
                            <AnimatedNumber value={dailyFiat} decimals={2} prefix={currencySymbol} />
                          )}
                        </span>
                        <span className="text-sm font-bold text-amber-500 font-orbitron">
                            {rewardUnit === 'sats' ? 'SATS' : currency}
                        </span>
                    </div>
                    <p className="text-[8px] text-gray-500/60 font-mono mt-0.5">Based on 30-day avg network hashrate</p>
                </div>
                
                {/* Navigation Arrow */}
                <button 
                    onClick={toggleRewardUnit}
                    className="h-full px-4 text-amber-500/50 hover:text-amber-300 transition-all duration-200 border-l border-amber-500/10 active:scale-95 flex items-center justify-center group"
                    aria-label="Toggle currency"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:drop-shadow-[0_0_8px_#f7931a] group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Chances of Solo Mining Display */}
        <div className="mt-4 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg blur-sm"></div>
            <div className="relative border border-amber-500/30 bg-black/60 rounded-lg flex justify-between items-center overflow-hidden h-28 pr-0">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_10px_#f7931a]"></div>
                
                <div className="flex flex-col z-10 p-4 flex-1">
                    <span className="text-xs text-amber-400/80 uppercase tracking-[0.2em] font-orbitron">
                        Chances of Solo Mining
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl md:text-3xl font-bold text-white text-glow font-orbitron">
                             <span className="text-xl mr-1">1 /</span>
                             <AnimatedNumber value={oneInXValue} />
                             <span className="text-sm font-bold text-amber-500 font-orbitron ml-2" style={{ textShadow: 'none' }}>{timeFrameLabel}</span>
                        </span>
                    </div>
                    <p className="text-[8px] text-gray-500/60 font-mono mt-1">
                        Solo win reward {blockRewardBtc.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} BTC / {blockRewardFiat.toLocaleString(undefined, { style: 'currency', currency: currency, maximumFractionDigits: 0 })}
                    </p>
                </div>

                 {/* Navigation Arrow - Cycles TimeFrame */}
                <button 
                    onClick={cycleTimeFrame}
                    className="h-full px-4 text-amber-500/50 hover:text-amber-300 transition-all duration-200 border-l border-amber-500/10 active:scale-95 flex items-center justify-center group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:drop-shadow-[0_0_8px_#f7931a] group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Price Section - Button with inner crossed price */}
        <div className="w-full pt-6 md:pt-14">
            <button 
              onClick={handleBuyClick}
              className="cyber-button w-full flex items-center justify-center gap-4 group box-border" 
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              <span className="text-gray-500 line-through text-lg group-hover:text-gray-400 transition-colors font-sans">
                  {originalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}{currencySymbol}
              </span>
              <span className="text-xl md:text-2xl">
                  {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}{currencySymbol} BUY NOW
              </span>
            </button>
        </div>
        
        {/* Mobile Currency Toggle - Only visible on small screens below buy button */}
        <div className="mt-6 md:hidden flex justify-center w-full">
            <CurrencyToggle 
                currency={currency} 
                onToggle={onToggleCurrency} 
                className="group scale-75 origin-center"
            />
        </div>

      </div>
    </div>
  );
};


const MinerImage: React.FC<{ miner: Miner; animationClass: string }> = ({ miner, animationClass }) => (
    <div className="w-full h-64 md:h-auto md:flex-1 flex justify-center items-center relative">
        <img 
            key={miner.id}
            src={miner.imageUrl} 
            alt={`${miner.name} ${miner.model}`} 
            className={`object-contain max-h-[250px] md:max-h-[400px] w-auto filter drop-shadow-[0_0_25px_rgba(247,147,26,0.5)] transition-transform duration-300 ${animationClass}`}
        />
    </div>
);


const MinerSelector: React.FC<{ networkHashrate: number; btcPrice: number; currency: 'USD' | 'EUR'; eurRate: number; onToggleCurrency: () => void }> = ({ networkHashrate, btcPrice, currency, eurRate, onToggleCurrency }) => {
  const [currentIndex, setCurrentIndex] = useState(2);
  const [animationClass, setAnimationClass] = useState('animate-fade-in');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationClass('animate-slide-out-left');
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % MINERS.length);
      setAnimationClass('animate-slide-in-right');
      setTimeout(() => setIsAnimating(false), ANIMATION_DURATION);
    }, ANIMATION_DURATION);
  }, [isAnimating]);

  const handlePrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationClass('animate-slide-out-right');
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + MINERS.length) % MINERS.length);
      setAnimationClass('animate-slide-in-left');
      setTimeout(() => setIsAnimating(false), ANIMATION_DURATION);
    }, ANIMATION_DURATION);
  }, [isAnimating]);

  const currentMiner = MINERS[currentIndex];
  
  return (
    <main className="w-full max-w-md md:max-w-6xl mx-auto rounded-3xl shadow-lg relative pt-40 pb-24 px-8 mt-20 md:grid md:grid-cols-2 md:gap-12 md:p-12 md:pb-16 md:mt-0">
        
      {/* --- Image Section (Column 1 on Desktop) --- */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-xs sm:max-w-sm md:relative md:col-span-1 md:top-auto md:left-auto md:translate-x-0 md:max-w-none md:h-full flex flex-col items-center justify-center md:-translate-y-9">
        <div className="relative flex items-center justify-center w-full h-full">
            <ArrowButton direction="left" onClick={handlePrev} disabled={isAnimating} />
            <MinerImage miner={currentMiner} animationClass={animationClass} />
            <ArrowButton direction="right" onClick={handleNext} disabled={isAnimating} />
        </div>
        <PaginationDots total={MINERS.length} current={currentIndex} />
      </div>

      {/* --- Details Section (Column 2 on Desktop) --- */}
      <div className="md:col-span-1 flex flex-col items-center justify-center relative">
        <MinerDetails 
            miner={currentMiner} 
            networkHashrate={networkHashrate} 
            btcPrice={btcPrice} 
            currency={currency}
            eurRate={eurRate}
            onToggleCurrency={onToggleCurrency}
        />
      </div>

    </main>
  );
}

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [tip, setTip] = useState('');

  useEffect(() => {
    // Select a random tip on mount
    setTip(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        const newProgress = p + (100 / (LOADING_DURATION / 100));
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md animate-fade-in">
       <DecryptedText
          text="bitaxe.world"
          animateOn="view"
          sequential={true}
          revealDirection="center"
          speed={100}
          className="text-amber-300"
          parentClassName="text-5xl md:text-7xl font-bold tracking-widest uppercase mb-8 font-orbitron text-glow"
          encryptedClassName="text-amber-300"
       />
        <div className="h-4 w-full bg-slate-900/50 p-[2px] cyber-bar-container mb-4">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 cyber-bar-fill"
              style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
            />
        </div>
        <p className="font-mono text-sm text-amber-300/80 animate-fade-in-up h-4" style={{textShadow: '0 0 3px rgba(247, 147, 26, 0.7)'}}>
          {tip}
        </p>
    </div>
  );
};

const SupportBanner: React.FC<{ onDonate: () => void }> = ({ onDonate }) => {
  return (
    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center text-center gap-4 px-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <p className="text-sm text-gray-400 font-mono hidden sm:block">Like bitaxe.world? Consider fueling the network.</p>
        <button onClick={onDonate} className="cyber-button-small whitespace-nowrap">
            Buy me a Coffee
        </button>
    </div>
  )
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [networkHashrate, setNetworkHashrate] = useState<number>(FALLBACK_NETWORK_HASHRATE);
  const [btcPrice, setBtcPrice] = useState<number>(95000); // Default fallback price
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  const [eurRate, setEurRate] = useState<number>(0.95); // Fallback rate
  const [showDonationModal, setShowDonationModal] = useState(false);

  useEffect(() => {
    const initApp = async () => {
        // 1. Fetch Network Hashrate
        try {
            const response = await fetch('https://api.blockchain.info/charts/hash-rate?timespan=30days&format=json&cors=true');
            if (response.ok) {
                const data = await response.json();
                if (data.values && data.values.length > 0) {
                    const totalHashrate = data.values.reduce((acc: number, curr: {x: number, y: number}) => acc + curr.y, 0);
                    const averageHashrate = totalHashrate / data.values.length;
                    setNetworkHashrate(averageHashrate);
                }
            }
        } catch (error) {
            console.warn("Failed to fetch network hashrate, using fallback.", error);
        }

        // 2. Fetch BTC Price (Coinbase API is usually reliable and free)
        try {
           const priceResponse = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
           if (priceResponse.ok) {
             const priceData = await priceResponse.json();
             const price = parseFloat(priceData.data.amount);
             if (!isNaN(price)) {
               setBtcPrice(price);
             }
           }
        } catch (error) {
          console.warn("Failed to fetch BTC price, using fallback.", error);
        }
        
        // 3. Fetch EUR Rate
        try {
            const rateResponse = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
            if (rateResponse.ok) {
                const rateData = await rateResponse.json();
                const rate = parseFloat(rateData.data.rates.EUR);
                if (!isNaN(rate)) {
                    setEurRate(rate);
                }
            }
        } catch (error) {
            console.warn("Failed to fetch exchange rate, using fallback.", error);
        }

        // 4. Wait for loading animation
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, LOADING_DURATION);

        return () => clearTimeout(timer);
    };

    initApp();
  }, []);

  const toggleCurrency = () => {
      setCurrency(prev => prev === 'USD' ? 'EUR' : 'USD');
  }

  return (
    <div className="min-h-screen w-full bg-black font-sans text-gray-200 overflow-hidden relative">
      <LetterGlitch
        glitchColors={['#f7931a', '#ffb86c', '#ffddaa']}
        glitchSpeed={50}
        centerVignette={false}
        outerVignette={false}
        smooth={true}
        className="absolute top-0 left-0 w-full h-full z-0 blur-[4px]"
      />
      
      {/* Desktop Currency Toggle - Hidden on mobile */}
      {!isLoading && (
        <CurrencyToggle 
            currency={currency} 
            onToggle={toggleCurrency} 
            className="hidden md:block absolute top-8 left-8 z-50 group"
        />
      )}

      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
        {isLoading ? (
           <LoadingScreen />
        ) : (
          <>
            <MinerSelector 
                networkHashrate={networkHashrate} 
                btcPrice={btcPrice} 
                currency={currency}
                eurRate={eurRate}
                onToggleCurrency={toggleCurrency}
            />
            <SupportBanner onDonate={() => setShowDonationModal(true)} />
          </>
        )}
      </div>
      
      {/* Donation Modal */}
      <DonationModal isOpen={showDonationModal} onClose={() => setShowDonationModal(false)} />
    </div>
  );
}

export default App;
