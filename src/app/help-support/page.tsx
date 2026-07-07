import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { HelpCircle, BookOpen, Compass, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Help & Support',
  description: 'Get quick answers to common questions, setup guides, and troubleshooting tips for your Velora account.',
  alternates: {
    canonical: '/help-support',
  },
  openGraph: {
    title: 'Help & Support — Velora',
    description: 'Guides, troubleshooting tips, and support for your Velora account.',
    url: '/help-support',
  },
};

export default function HelpSupport() {
  const articles = [
    {
      title: 'Getting Started',
      description: "New to Velora? Here's a friendly walkthrough — from connecting your wallet to exploring your dashboard for the first time.",
      icon: <Compass className="w-5 h-5 text-primary" />
    },
    {
      title: 'Understanding Your Dashboard',
      description: "Your dashboard shows everything that matters — your community, your activity, and your rewards. Here's how to read it.",
      icon: <BookOpen className="w-5 h-5 text-primary" />
    },
    {
      title: 'Troubleshooting Tips',
      description: "Wallet not connecting? Page not loading? Don't worry — most issues have quick fixes. Check these common solutions first.",
      icon: <HelpCircle className="w-5 h-5 text-primary" />
    }
  ];

  return (
    <>
      <Navbar />
      <main className="flex-grow flex flex-col min-w-0 overflow-x-hidden pt-32 md:pt-36 pb-12">
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Help & Support</h1>
              <p className="text-muted-foreground text-sm">We&apos;ve put together guides and answers for the most common questions. If you can&apos;t find what you need, just reach out.</p>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/50 shadow-sm space-y-12">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Popular Topics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {articles.map((article, i) => (
                  <div key={i} className="glass-card p-6 rounded-2xl border border-border/50 hover:border-border transition-all space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border/50">
                      {article.icon}
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{article.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{article.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted rounded-3xl p-6 sm:p-8 border border-border/40 space-y-6">
              <h2 className="text-xl font-bold text-foreground">Before You Begin — Quick Checklist</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Most setup issues come from outdated wallet apps or browser settings. Run through this quick list and you&apos;ll likely be good to go in minutes.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <li className="flex items-start space-x-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Make sure your wallet app (MetaMask, Trust Wallet, etc.) is up to date.</span>
                </li>
                <li className="flex items-start space-x-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Check that your browser allows wallet popups and connection prompts.</span>
                </li>
                <li className="flex items-start space-x-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Have a small amount of BNB in your wallet for transaction fees (gas).</span>
                </li>
                <li className="flex items-start space-x-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Never share your recovery phrase or private keys with anyone — ever.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Still Need Help?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-border/50 space-y-3">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-foreground">Send us a message</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Head over to our Contact page to fill out our support form. We read every single message and usually respond within a few hours.
                  </p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-border/50 space-y-3">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-foreground">Stay safe</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our team will never ask for your passwords, seed phrases, or private keys. If someone does, it&apos;s not us. Always verify through official channels.
                  </p>
                </div>
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
