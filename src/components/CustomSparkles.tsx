import React from 'react';

interface SparklesProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function Sparkles({ className = 'w-4 h-4 text-purple-400', ...props }: SparklesProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer ⊙ (Circle with central point) */}
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      
      {/* ⊝ (Circle with horizontal line) */}
      <line x1="7" y1="12" x2="17" y2="12" strokeWidth="1.5" />
      
      {/* ⊜ (Circle with equals / secondary lines) representing cosmic balance */}
      <line x1="9" y1="15" x2="15" y2="15" strokeWidth="1.2" />
      <line x1="9" y1="9" x2="15" y2="9" strokeWidth="1.2" />
    </svg>
  );
}

export default Sparkles;
