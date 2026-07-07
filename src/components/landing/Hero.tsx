'use client'


import { ArrowRight, CheckCircle } from 'lucide-react'

const stats = [
  { value: '24/7', label: 'Always Available' },
  { value: 'PRIVATE', label: 'Your Keys, Your Control' },
  { value: 'INSTANT', label: 'Quick Onboarding' },
  { value: 'GLOBAL', label: 'Borderless Access' }
];

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
              <span>Trusted by growing communities worldwide</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
              Build Something <br />
              <span className="gradient-text">Meaningful Together</span> <br />
              with Velora
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Velora is where communities come alive. Connect your wallet, bring in the people you believe in, and grow together on a platform that&apos;s designed to be transparent, fair, and genuinely rewarding.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="/auth"
                className="glow-btn w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary-hover font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-primary/10 transition-all duration-200"
              >
                <span>Get Started — It&apos;s Quick</span>
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-card border border-border text-foreground hover:bg-muted font-semibold px-8 py-4 rounded-xl text-base shadow-sm transition-all duration-150"
              >
                See How It Works
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-border max-w-lg sm:max-w-none mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">{stat.value}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual — Tron Live Chart */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-muted rounded-lg transform rotate-2"></div>
              
              <div className="glass-card rounded-lg p-5 sm:p-6 relative border border-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">TRX</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">Tron Live Chart</span>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 w-fit">
                    <CheckCircle className="w-3.5 h-3.5" /> Real-time
                  </span>
                </div>

                <div className="w-full h-[300px] rounded-xl overflow-hidden bg-card border border-border/50">
                  <iframe 
                    src="https://s.tradingview.com/widgetembed/?symbol=BINANCE%3ATRXUSDT&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=131722&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en" 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="bg-muted rounded-2xl p-4 space-y-3.5 border border-border/50">
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-muted-foreground font-medium">Network</span>
                    <span className="font-bold text-foreground">BNB Smart Chain (BEP20)</span>
                  </div>
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-muted-foreground font-medium">Transaction Speed</span>
                    <span className="font-bold text-primary">~3 seconds</span>
                  </div>
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-muted-foreground font-medium">Fees</span>
                    <span className="font-bold text-foreground">Ultra-low</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
