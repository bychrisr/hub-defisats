import React from 'react';

interface SatsIconProps {
  size?: number;
  className?: string;
}

const SatsIcon: React.FC<SatsIconProps> = ({ size = 20, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
      style={{ color: 'hsl(var(--sats-icon-color))' }}
    >
      {/* Símbolo oficial de satoshi - baseado no código SVG oficial */}
      {/* Barra superior - quadrada */}
      <path fillRule="evenodd" clipRule="evenodd" d="M12.75 3V5.5H11.25V3H12.75Z" fill="currentColor" />
      
      {/* Linha longa superior */}
      <path fillRule="evenodd" clipRule="evenodd" d="M17 8.75H7V7.25H17V8.75Z" fill="currentColor" />
      
      {/* Linha longa central */}
      <path fillRule="evenodd" clipRule="evenodd" d="M17 12.7499H7V11.2499H17V12.7499Z" fill="currentColor" />
      
      {/* Linha longa inferior */}
      <path fillRule="evenodd" clipRule="evenodd" d="M17 16.75H7V15.25H17V16.75Z" fill="currentColor" />
      
      {/* Barra inferior - quadrada */}
      <path fillRule="evenodd" clipRule="evenodd" d="M12.75 18.5V21H11.25V18.5H12.75Z" fill="currentColor" />
    </svg>
  );
};

export default SatsIcon;
