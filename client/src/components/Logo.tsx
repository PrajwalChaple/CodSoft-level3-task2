import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="url(#apex-grad)" />
      
      {/* Dynamic interlocking flow elements representing A and F (ApexFlow) */}
      <path 
        d="M12 14C12 12.8954 12.8954 12 14 12H20C24.4183 12 28 15.5817 28 20C28 24.4183 24.4183 28 20 28H18C16.8954 28 16 27.1046 16 26V14" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M22 20C22 18.8954 22.8954 18 24 18C25.1046 18 26 18.8954 26 20C26 21.1046 25.1046 22 24 22C22.8954 22 22 21.1046 22 20Z" 
        fill="#00d4aa" 
      />
      <path 
        d="M14 20H18" 
        stroke="#00d4aa" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      
      <defs>
        <linearGradient id="apex-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6c63ff" />
          <stop offset="1" stopColor="#00d4aa" />
        </linearGradient>
      </defs>
    </svg>
  );
}
