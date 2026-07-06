'use client'

const steps = [
  {
    step: '01',
    title: 'Connect Your Wallet',
    description: "Open Velora and connect with MetaMask or any BSC wallet you already use. No forms, no sign-up headaches."
  },
  {
    step: '02',
    title: 'Set Up Your Account',
    description: "Your personal dashboard is ready in seconds. See your activity, manage your profile, and get a unique invite link to share with friends."
  },
  {
    step: '03',
    title: 'Invite People You Trust',
    description: "Share your invite link with friends and family. When they join and get started, both of you benefit from the growing community."
  },
  {
    step: '04',
    title: 'Watch Your Community Grow',
    description: "Track your team's progress in real-time from your dashboard. Everything is transparent — you always know exactly where you stand."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white relative overflow-hidden border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-bold tracking-wider text-sky-700 uppercase">How It Works</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Four simple steps. That&apos;s it.
          </p>
          <p className="text-slate-500 text-base leading-relaxed">
            No complicated setup, no confusing jargon. Just connect, activate, invite, and grow. You could be up and running in under 5 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative glass-card p-6 rounded-2xl border border-slate-100 space-y-6">
              <div aria-hidden="true" className="text-4xl font-black text-sky-600 tracking-wider font-mono">{step.step}</div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
