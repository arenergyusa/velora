'use client'


import { ArrowRight } from 'lucide-react'

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
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
            <span>Trusted by growing communities worldwide</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
            Build Something <br className="hidden sm:block" />
            <span className="gradient-text">Meaningful Together</span> <br className="hidden sm:block" />
            with Velora
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Velora is where communities come alive. Connect your wallet, bring in the people you believe in, and grow together on a platform that&apos;s designed to be transparent, fair, and genuinely rewarding.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-8 border-t border-border w-full">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">{stat.value}</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
