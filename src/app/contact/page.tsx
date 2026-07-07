import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Mail, MessageSquare, Globe } from 'lucide-react';

export const metadata = {
  title: 'Contact Us',
  description: 'Reach out to the Velora team for account questions, setup help, or general feedback. We are real people and we respond quickly.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Us — Velora',
    description: 'Get in touch with the Velora team for support, feedback, or general questions.',
    url: '/contact',
  },
};

export default function Contact() {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex flex-col min-w-0 overflow-x-hidden pt-32 md:pt-36 pb-12">
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Talk to Us</h1>
              <p className="text-muted-foreground text-sm">Whether you have a question, feedback, or just want to say hello — we&apos;d love to hear from you. Our team typically responds within a few hours.</p>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/50 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                <div className="md:col-span-5 space-y-6">
                  <h2 className="text-xl font-bold text-foreground">How to reach us</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pick whatever feels most comfortable. Email us for detailed questions, join our community chat for quick answers, or just fill out the form — we read every single message.
                  </p>

                  <div className="space-y-4">
                    {/*     <div className="flex items-center space-x-4 p-4 bg-muted rounded-2xl border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-border/50">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold uppercase">Email</div>
                    <a href="mailto:hello@universechain.online" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                      hello@universechain.online
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-muted rounded-2xl border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-border/50">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold uppercase">Community Chat</div>
                    <a href="https://t.me/universechain" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                      t.me/universechain
                    </a>
                  </div>
                </div> */}

                    <div className="flex items-center space-x-4 p-4 bg-muted rounded-2xl border border-border/50">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-border/50">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-bold uppercase">Platform Status</div>
                        <span className="text-sm font-bold text-primary flex items-center gap-1.5 mt-0.5">
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-slow"></span>
                          Everything&apos;s running smoothly
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7">
                  <div className="glass-card p-6 sm:p-8 rounded-3xl border border-border shadow-md">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-foreground">Send us a message</h3>
                      <p className="text-xs text-muted-foreground mt-1">We&apos;ll get back to you as soon as we can — usually within a few hours.</p>
                    </div>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Name</label>
                        <input
                          type="text"
                          required
                          placeholder="What should we call you?"
                          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">What&apos;s on your mind?</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Tell us how we can help..."
                          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary-hover font-bold py-3.5 rounded-xl text-sm shadow-md transition-all duration-200"
                      >
                        <span>Send Message</span>
                      </button>
                    </form>
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
