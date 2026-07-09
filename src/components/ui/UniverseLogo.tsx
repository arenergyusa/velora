import React from 'react';
import Image from 'next/image';

export const UniverseLogo = ({ className = "h-10 w-auto" }: { className?: string }) => (
  <div className={`flex items-center gap-0.5 ${className}`}>
    <Image
      src="/og-image.png"
      alt="Velora Logo"
      width={100}
      height={100}
      className="h-full w-auto object-contain drop-shadow-md z-10"
      priority
    />
    <Image
      src="/velora-logo.png"
      alt="Velora Text"
      width={120}
      height={30}
      className="h-[42%] md:h-[46%] w-auto object-contain opacity-90 brightness-110 contrast-125 translate-y-[2px]"
      priority
    />
  </div>
);
