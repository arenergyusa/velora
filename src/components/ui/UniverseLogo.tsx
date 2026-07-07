import React from 'react';
import Image from 'next/image';

export const UniverseLogo = ({ className = "h-10 w-auto" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <Image
      src="/og-image.png"
      alt="Velora Logo"
      width={100}
      height={100}
      className="h-full w-auto object-contain"
      priority
    />
    <span className="text-xl md:text-2xl font-black tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
      VELORA
    </span>
  </div>
);
