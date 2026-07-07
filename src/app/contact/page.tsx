'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error: unknown) {
      console.error('Contact submit error:', error);
      setStatus('error');
      const msg = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

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
                    Pick whatever feels most comfortable. Just fill out the form — we read every single message.
                  </p>

                  <div className="space-y-4">
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

                    {status === 'success' ? (
                      <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 bg-primary/5 border border-primary/20 rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-foreground">Message Sent!</h4>
                          <p className="text-sm text-muted-foreground mt-1">Thanks for reaching out. We&apos;ll get back to you shortly.</p>
                        </div>
                        <button
                          onClick={() => setStatus('idle')}
                          className="mt-4 text-sm font-bold text-primary hover:text-primary-hover transition-colors"
                        >
                          Send another message
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {status === 'error' && (
                          <div className="p-3 mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                            {errorMessage}
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Name</label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="What should we call you?"
                            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                            disabled={status === 'loading'}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                            disabled={status === 'loading'}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">What&apos;s on your mind?</label>
                          <textarea
                            name="message"
                            rows={4}
                            required
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Tell us how we can help..."
                            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none disabled:opacity-50"
                            disabled={status === 'loading'}
                          ></textarea>
                        </div>
                        <button
                          type="submit"
                          disabled={status === 'loading'}
                          className="w-full inline-flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary-hover font-bold py-3.5 rounded-xl text-sm shadow-md transition-all duration-200 disabled:opacity-70"
                        >
                          {status === 'loading' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <span>Send Message</span>
                          )}
                        </button>
                      </form>
                    )}
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
