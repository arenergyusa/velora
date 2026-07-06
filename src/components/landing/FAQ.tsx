'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ArrowRight } from 'lucide-react'

const faqs = [
  {
    question: "How do I get started with Velora?",
    answer: "Getting started is easy. Simply connect your BSC wallet (like MetaMask) using the 'Connect Wallet' button. Once connected, browse our tiers, select the one that fits your goals, and deposit TRX to activate."
  },
  {
    question: "How do the daily rewards work?",
    answer: "Your rewards are calculated based on your active tier. They are generated daily and credited to your account dashboard, from which you can withdraw to your wallet instantly."
  },
  {
    question: "Is there a maximum reward cap?",
    answer: "Yes, to ensure the sustainability of the platform, accounts have a maximum cap of 3x to 4x your deposited amount. Once this cap is reached, you will need to re-deposit or upgrade your tier to continue."
  },
  {
    question: "How does the community building system work?",
    answer: "When you share your invite link, you receive bonuses from users who join and participate through your link, across your entire community. This means you benefit not only from direct invites but also from the community they build."
  },
  {
    question: "Are my deposits locked?",
    answer: "Your initial deposit acts as your tier activation and contributes to overall liquidity. While the principal isn&apos;t withdrawn directly, your daily rewards and community bonuses are fully liquid and can be withdrawn at any time."
  }
];

export function FAQ() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left lg:sticky lg:top-32">
            <h2 className="text-xs font-bold tracking-wider text-sky-700 uppercase">FAQ</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Got questions? <br className="hidden lg:block" /> We&apos;ve got answers.
            </h3>
            <p className="text-slate-500 text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
              If you can&apos;t find what you&apos;re looking for, feel free to reach out to our team via the contact page or community chat.
            </p>
            <div className="pt-2 flex justify-center lg:justify-start">
              <Link
                href="/contact"
                className="inline-flex items-center space-x-2 text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors bg-sky-50 px-4 py-2 rounded-xl"
              >
                <span>Contact Support</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="glass-card border border-slate-100 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none bg-white hover:bg-slate-50/50 transition-colors"
                >
                  <span className="font-bold text-slate-800 pr-4 text-base">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${activeFaq === i ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-200 ${
                        activeFaq === i ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
                <div
                  className={`transition-all duration-300 ${
                    activeFaq === i ? 'max-h-96 border-t border-slate-100' : 'max-h-0 overflow-hidden'
                  }`}
                >
                  <div className="p-6 text-sm text-slate-500 leading-relaxed bg-slate-50/50">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
