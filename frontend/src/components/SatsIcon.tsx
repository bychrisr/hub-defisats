import React from 'react';

interface SatsIconProps {
  size?: number;
  className?: string;
}

const SatsIcon: React.FC<SatsIconProps> = ({ size = 16, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bitcoin "B" symbol with sats styling */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h6v2H8v-2z"
        fill="currentColor"
      />
      {/* Small "s" for sats */}
      <text
        x="12"
        y="20"
        textAnchor="middle"
        fontSize="6"
        fill="currentColor"
        fontWeight="bold"
      >
        s
      </text>
    </svg>
  );
};

export default SatsIcon;
