'use client'

import { Lock, Zap, Heart, Globe } from 'lucide-react'

const features = [
  {
    icon: <Lock className="w-6 h-6 text-primary" />,
    title: 'Your Identity Stays Yours',
    description: "No passwords to remember, no email signups. Just connect your wallet and you're in. We believe your digital identity should be in your hands — not ours."
  },
  {
    icon: <Zap className="w-6 h-6 text-primary" />,
    title: 'Built for Speed & Simplicity',
    description: "Every interaction is designed to be fast and intuitive. Whether you're checking your dashboard or inviting a friend, things just work — no friction, no confusion."
  },
  {
    icon: <Heart className="w-6 h-6 text-primary" />,
    title: 'Community First, Always',
    description: "Velora grows because people share it with people they trust. We've built everything around that idea — a platform where your community genuinely benefits alongside you."
  },
  {
    icon: <Globe className="w-6 h-6 text-primary" />,
    title: 'Works Everywhere You Do',
    description: "On the bus, at a café, or at your desk — Velora looks and feels great on every screen. We obsess over the small details so you don't have to."
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-card border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-bold tracking-wider text-primary uppercase">Why People Choose Us</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            A platform that respects your time and trust
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            We didn&apos;t build Velora to impress — we built it to be useful. Here&apos;s what makes it different from everything else out there.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-5 glass-card p-6 rounded-2xl border border-border/50 hover:border-border transition-all">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border/50">
                {feature.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
