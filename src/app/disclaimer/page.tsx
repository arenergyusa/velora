import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Disclaimer',
  description: 'Important things to know before using Velora — risks, responsibilities, and honest disclosures.',
  alternates: {
    canonical: '/disclaimer',
  },
  openGraph: {
    title: 'Disclaimer — Velora',
    description: 'Important information about risks and responsibilities when using Velora.',
    url: '/disclaimer',
  },
};

export default function Disclaimer() {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex flex-col min-w-0 overflow-x-hidden pt-32 md:pt-36 pb-12">
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Disclaimer</h1>
              <p className="text-slate-500 text-sm">Last updated: June 2026. We believe in being upfront — here are some important things you should know.</p>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="prose prose-slate text-slate-600 max-w-none space-y-8 leading-relaxed text-sm">
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">1. This is not financial advice</h2>
              <p>
                Nothing on this website — including tiers, reward descriptions, or community examples — should be taken as financial, investment, tax, or legal advice. We&apos;re a technology platform, not financial advisors.
              </p>
              <p>
                Cryptocurrency investments involve a high degree of market risk. The value of digital assets can go up or down rapidly. Please understand these risks fully before participating, and never use funds you cannot afford to lose.
              </p>
              <p>
                If you&apos;re unsure about anything, talk to a qualified professional before making any decisions. We genuinely mean that.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">2. Results depend on you</h2>
              <p>
                Velora provides tools for community building. How your experience turns out depends on many factors — your effort, your community, market conditions, and timing. We don&apos;t guarantee any specific outcome.
              </p>
              <p>
                We&apos;ll always be honest about how the platform works, but we can&apos;t predict or promise what results you&apos;ll see.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">3. Blockchain transactions are permanent</h2>
              <p>
                Once a transaction happens on the blockchain, it can&apos;t be reversed. Please double-check wallet addresses, amounts, and approvals before confirming anything. Take your time — there&apos;s no undo button.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">4. Technology has its limits</h2>
              <p>
                Like any online platform, Velora can be affected by things outside our control — slow networks, wallet provider issues, browser bugs, or hosting problems. We work hard to keep things stable, but perfect uptime isn&apos;t something anyone can promise.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">5. Use your own judgment</h2>
              <p>
                We encourage you to read everything on this website carefully, ask questions before you start, and only participate with amounts you&apos;re comfortable with. The best decisions come from understanding, not pressure.
              </p>
            </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
