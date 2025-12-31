// Teamly Logo Component with pink gradient theme - Web version
import React from 'react';
import { Colors } from 'teamly_shared';

interface TeamlyLogoProps {
  size?: number;
}

const TeamlyLogo: React.FC<TeamlyLogoProps> = ({ size = 120 }) => {
  return (
    <div style={{ width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <defs>
          <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={Colors.gradientStart} />
            <stop offset="100%" stopColor={Colors.gradientEnd} />
          </linearGradient>
        </defs>
        
        {/* Left person - lighter pink */}
        <circle cx="30" cy="35" r="15" fill={Colors.gradientStart} opacity="0.8" />
        <circle cx="30" cy="75" r="25" fill={Colors.gradientStart} opacity="0.8" />
        
        {/* Center person - gradient */}
        <circle cx="60" cy="28" r="16" fill="url(#pinkGradient)" />
        <circle cx="60" cy="75" r="30" fill="url(#pinkGradient)" />
        
        {/* Right person - darker pink */}
        <circle cx="90" cy="35" r="15" fill={Colors.gradientEnd} opacity="0.9" />
        <circle cx="90" cy="75" r="25" fill={Colors.gradientEnd} opacity="0.9" />
      </svg>
    </div>
  );
};

export default TeamlyLogo;
