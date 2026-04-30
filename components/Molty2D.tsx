/**
 * Molty2D.tsx
 * 2D animated Molty character (red sphere with antenna and expressive eyes)
 * 
 * Animations:
 * - Antenna sway left/right
 * - Eyes blink and look around
 * - Body subtle bob
 * - Ears wiggle
 */

'use client';

import React from 'react';

interface Molty2DProps {
  className?: string;
}

export const Molty2D: React.FC<Molty2DProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 200 280"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Define animations */}
      <defs>
        <style>{`
          @keyframes antennaSway {
            0% { transform: rotate(-8deg); transform-origin: 100px 60px; }
            50% { transform: rotate(8deg); transform-origin: 100px 60px; }
            100% { transform: rotate(-8deg); transform-origin: 100px 60px; }
          }
          
          @keyframes antennaSway2 {
            0% { transform: rotate(8deg); transform-origin: 100px 60px; }
            50% { transform: rotate(-8deg); transform-origin: 100px 60px; }
            100% { transform: rotate(8deg); transform-origin: 100px 60px; }
          }
          
          @keyframes eyeBlink {
            0% { cy: 100px; ry: 12px; }
            5% { cy: 105px; ry: 4px; }
            10% { cy: 100px; ry: 12px; }
            100% { cy: 100px; ry: 12px; }
          }
          
          @keyframes eyeLookLeft {
            0% { cx: 75px; }
            25% { cx: 68px; }
            50% { cx: 75px; }
            75% { cx: 82px; }
            100% { cx: 75px; }
          }
          
          @keyframes eyeLookRight {
            0% { cx: 125px; }
            25% { cx: 132px; }
            50% { cx: 125px; }
            75% { cx: 118px; }
            100% { cx: 125px; }
          }
          
          @keyframes bodyBob {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
          
          @keyframes earWiggle {
            0% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
            100% { transform: rotate(-5deg); }
          }
          
          .antenna-left {
            animation: antennaSway 2.5s ease-in-out infinite;
          }
          
          .antenna-right {
            animation: antennaSway2 2.5s ease-in-out infinite;
          }
          
          .eye-left {
            animation: eyeLookLeft 4s ease-in-out infinite, eyeBlink 3.5s ease-in-out infinite;
          }
          
          .eye-right {
            animation: eyeLookRight 4s ease-in-out infinite, eyeBlink 3.5s ease-in-out 0.2s infinite;
          }
          
          .body-container {
            animation: bodyBob 2.2s ease-in-out infinite;
          }
          
          .ear-left {
            animation: earWiggle 1.8s ease-in-out infinite;
            transform-origin: 55px 85px;
          }
          
          .ear-right {
            animation: earWiggle 1.8s ease-in-out 0.1s infinite;
            transform-origin: 145px 85px;
          }
        `}</style>
      </defs>

      {/* Background stars (optional, matches your image) */}
      <circle cx="20" cy="30" r="1.5" fill="#4ade80" opacity="0.6" />
      <circle cx="180" cy="50" r="1" fill="#60a5fa" opacity="0.5" />
      <circle cx="160" cy="20" r="1.5" fill="#fbbf24" opacity="0.4" />
      <circle cx="30" cy="200" r="1" fill="#f472b6" opacity="0.5" />
      <circle cx="170" cy="260" r="1.5" fill="#a78bfa" opacity="0.4" />

      {/* Body container for bobbing animation */}
      <g className="body-container">
        {/* Main body (red sphere) */}
        <circle cx="100" cy="120" r="60" fill="#FF3333" stroke="#CC2222" strokeWidth="2" />

        {/* Left ear */}
        <circle cx="55" cy="85" r="20" fill="#FF3333" stroke="#CC2222" strokeWidth="2" className="ear-left" />

        {/* Right ear */}
        <circle cx="145" cy="85" r="20" fill="#FF3333" stroke="#CC2222" strokeWidth="2" className="ear-right" />

        {/* Left antenna */}
        <g className="antenna-left">
          <line x1="75" y1="60" x2="65" y2="40" stroke="#FF3333" strokeWidth="4" strokeLinecap="round" />
          <circle cx="65" cy="40" r="6" fill="#FF3333" stroke="#CC2222" strokeWidth="1" />
        </g>

        {/* Right antenna */}
        <g className="antenna-right">
          <line x1="125" y1="60" x2="135" y2="40" stroke="#FF3333" strokeWidth="4" strokeLinecap="round" />
          <circle cx="135" cy="40" r="6" fill="#FF3333" stroke="#CC2222" strokeWidth="1" />
        </g>

        {/* Left eye white */}
        <ellipse cx="75" cy="100" rx="16" ry="12" fill="#FFFFFF" stroke="#333333" strokeWidth="1" />

        {/* Right eye white */}
        <ellipse cx="125" cy="100" rx="16" ry="12" fill="#FFFFFF" stroke="#333333" strokeWidth="1" />

        {/* Left pupil (animated) */}
        <circle cx="75" cy="100" r="8" fill="#001A4D" className="eye-left" />

        {/* Right pupil (animated) */}
        <circle cx="125" cy="100" r="8" fill="#001A4D" className="eye-right" />

        {/* Left eye shine */}
        <circle cx="72" cy="97" r="3" fill="#FFFFFF" opacity="0.8" />

        {/* Right eye shine */}
        <circle cx="122" cy="97" r="3" fill="#FFFFFF" opacity="0.8" />

        {/* Mouth (subtle smile) */}
        <path
          d="M 85 145 Q 100 155 115 145"
          stroke="#CC2222"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Bottom body accent */}
        <ellipse cx="100" cy="170" rx="45" ry="25" fill="#FF4444" opacity="0.3" />
      </g>

      {/* Happiness indicator (pulsing) */}
      <g opacity="0.4">
        <text
          x="100"
          y="240"
          textAnchor="middle"
          fontSize="14"
          fill="#FF3333"
          fontWeight="bold"
          style={{
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          Ready to assist
        </text>
      </g>
    </svg>
  );
};

export default Molty2D;
