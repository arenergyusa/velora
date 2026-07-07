'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Wallet, ArrowRight, Home, Info, Phone, HelpCircle } from 'lucide-react';
import { UniverseLogo } from '@/components/ui/UniverseLogo';
// useWallet removed
export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const navLinks = [
    { name: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'About', href: '/about', icon: <Info className="w-4 h-4" /> },
    { name: 'Contact', href: '/contact', icon: <Phone className="w-4 h-4" /> },
    { name: 'Help & Support', href: '/help-support', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileMenuOpen
            ? 'glass-nav py-3 shadow-sm'
            : 'bg-card/80 backdrop-blur-md py-4 border-b border-border'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center" aria-label="Velora Home">
                <div className="flex items-center justify-center">
                  <UniverseLogo className="h-10 w-auto" />
                </div>
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex space-x-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>

              <div className="w-px h-8 bg-border mx-2"></div>

              <a
                href="/auth"
                className="glow-btn flex items-center space-x-2 bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200"
              >
                <Wallet className="w-4 h-4" />
                <span>Launch App</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Rendered as sibling to avoid nested backdrop-filter bug */}
      {isMobileMenuOpen && (
        <div className="lg:hidden glass-nav fixed top-[64px] sm:top-[72px] left-0 right-0 bottom-0 z-40 animate-fade-in shadow-lg overflow-y-auto pb-24 border-t border-border/50">
          <div className="px-4 pt-2 pb-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-colors ${
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary shadow-2xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
            <div className="pt-6 border-t border-border mt-4 px-1">
                <a
                  href="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-3 rounded-xl text-base font-semibold shadow-sm transition-all duration-200"
                >
                  <Wallet className="w-5 h-5" />
                  <span>Launch App</span>
                  <ArrowRight className="w-5 h-5" />
                </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
