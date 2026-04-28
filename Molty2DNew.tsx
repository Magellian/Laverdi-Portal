/**
 * Molty2D.tsx
 * Animated Molty mascot with arms out, orbiting service icons
 */

'use client';

import React from 'react';

interface Molty2DProps {
  className?: string;
}

export const Molty2D: React.FC<Molty2DProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 400 400"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>{`
          @keyframes antennaSway {
            0% { transform: rotate(-8deg); transform-origin: 200px 100px; }
            50% { transform: rotate(8deg); transform-origin: 200px 100px; }
            100% { transform: rotate(-8deg); transform-origin: 200px 100px; }
          }
          @keyframes antennaSway2 {
            0% { transform: rotate(8deg); transform-origin: 200px 100px; }
            50% { transform: rotate(-8deg); transform-origin: 200px 100px; }
            100% { transform: rotate(8deg); transform-origin: 200px 100px; }
          }
          @keyframes eyeBlink {
            0% { ry: 14px; }
            5% { ry: 2px; }
            10% { ry: 14px; }
            100% { ry: 14px; }
          }
          @keyframes eyeLookLeft {
            0% { cx: 170px; }
            25% { cx: 162px; }
            50% { cx: 170px; }
            75% { cx: 178px; }
            100% { cx: 170px; }
          }
          @keyframes eyeLookRight {
            0% { cx: 230px; }
            25% { cx: 238px; }
            50% { cx: 230px; }
            75% { cx: 222px; }
            100% { cx: 230px; }
          }
          @keyframes bodyBob {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }
          @keyframes earWiggle {
            0% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
            100% { transform: rotate(-5deg); }
          }
          @keyframes armWaveLeft {
            0% { transform: translate(0px, 0px); }
            50% { transform: translate(-2px, -2px); }
            100% { transform: translate(0px, 0px); }
          }
          @keyframes armWaveRight {
            0% { transform: translate(0px, 0px); }
            50% { transform: translate(2px, -2px); }
            100% { transform: translate(0px, 0px); }
          }
          @keyframes orbit1 {
            0% { transform: rotate(0deg) translateX(170px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(170px) rotate(-360deg); }
          }
          @keyframes orbit2 {
            0% { transform: rotate(60deg) translateX(170px) rotate(-60deg); }
            100% { transform: rotate(420deg) translateX(170px) rotate(-420deg); }
          }
          @keyframes orbit3 {
            0% { transform: rotate(120deg) translateX(170px) rotate(-120deg); }
            100% { transform: rotate(480deg) translateX(170px) rotate(-480deg); }
          }
          @keyframes orbit4 {
            0% { transform: rotate(180deg) translateX(170px) rotate(-180deg); }
            100% { transform: rotate(540deg) translateX(170px) rotate(-540deg); }
          }
          @keyframes orbit5 {
            0% { transform: rotate(240deg) translateX(170px) rotate(-240deg); }
            100% { transform: rotate(600deg) translateX(170px) rotate(-600deg); }
          }
          @keyframes orbit6 {
            0% { transform: rotate(300deg) translateX(170px) rotate(-300deg); }
            100% { transform: rotate(660deg) translateX(170px) rotate(-660deg); }
          }
          @keyframes iconPulse {
            0% { opacity: 0.85; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0.85; transform: scale(1); }
          }
          .antenna-left { animation: antennaSway 2.5s ease-in-out infinite; }
          .antenna-right { animation: antennaSway2 2.5s ease-in-out infinite; }
          .eye-left { animation: eyeLookLeft 4s ease-in-out infinite, eyeBlink 3.5s ease-in-out infinite; }
          .eye-right { animation: eyeLookRight 4s ease-in-out infinite, eyeBlink 3.5s ease-in-out 0.2s infinite; }
          .body-container { animation: bodyBob 2.2s ease-in-out infinite; }
          .ear-left { animation: earWiggle 1.8s ease-in-out infinite; transform-origin: 145px 135px; }
          .ear-right { animation: earWiggle 1.8s ease-in-out 0.1s infinite; transform-origin: 255px 135px; }
          .arm-left { animation: armWaveLeft 2s ease-in-out infinite; }
          .arm-right { animation: armWaveRight 2s ease-in-out 0.3s infinite; }
          .orbit-icon-1 { animation: orbit1 12s linear infinite, iconPulse 3s ease-in-out infinite; transform-origin: 200px 195px; }
          .orbit-icon-2 { animation: orbit2 12s linear infinite, iconPulse 3s ease-in-out 0.5s infinite; transform-origin: 200px 195px; }
          .orbit-icon-3 { animation: orbit3 12s linear infinite, iconPulse 3s ease-in-out 1s infinite; transform-origin: 200px 195px; }
          .orbit-icon-4 { animation: orbit4 12s linear infinite, iconPulse 3s ease-in-out 1.5s infinite; transform-origin: 200px 195px; }
          .orbit-icon-5 { animation: orbit5 12s linear infinite, iconPulse 3s ease-in-out 2s infinite; transform-origin: 200px 195px; }
          .orbit-icon-6 { animation: orbit6 12s linear infinite, iconPulse 3s ease-in-out 2.5s infinite; transform-origin: 200px 195px; }
        `}</style>
        {/* Glow filter for icons */}
        <filter id="iconGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Orbiting service icons */}
      {/* Email icon */}
      <g className="orbit-icon-1" filter="url(#iconGlow)">
        <circle cx="200" cy="195" r="18" fill="#EA4335" opacity="0.9" />
        <text x="200" y="201" textAnchor="middle" fontSize="18" fill="white">✉</text>
      </g>

      {/* Calendar icon */}
      <g className="orbit-icon-2" filter="url(#iconGlow)">
        <circle cx="200" cy="195" r="18" fill="#4285F4" opacity="0.9" />
        <text x="200" y="201" textAnchor="middle" fontSize="18" fill="white">📅</text>
      </g>

      {/* Chat/social icon */}
      <g className="orbit-icon-3" filter="url(#iconGlow)">
        <circle cx="200" cy="195" r="18" fill="#25D366" opacity="0.9" />
        <text x="200" y="201" textAnchor="middle" fontSize="18" fill="white">💬</text>
      </g>

      {/* Cloud/Drive icon */}
      <g className="orbit-icon-4" filter="url(#iconGlow)">
        <circle cx="200" cy="195" r="18" fill="#FBBC04" opacity="0.9" />
        <text x="200" y="201" textAnchor="middle" fontSize="18" fill="white">☁</text>
      </g>

      {/* Phone icon */}
      <g className="orbit-icon-5" filter="url(#iconGlow)">
        <circle cx="200" cy="195" r="18" fill="#9333EA" opacity="0.9" />
        <text x="200" y="201" textAnchor="middle" fontSize="18" fill="white">📱</text>
      </g>

      {/* Code/automation icon */}
      <g className="orbit-icon-6" filter="url(#iconGlow)">
        <circle cx="200" cy="195" r="18" fill="#0EA5E9" opacity="0.9" />
        <text x="200" y="201" textAnchor="middle" fontSize="18" fill="white">⚡</text>
      </g>

      {/* Orbit ring (subtle) */}
      <ellipse cx="200" cy="195" rx="170" ry="170" fill="none" stroke="#FF3333" strokeWidth="0.5" opacity="0.15" strokeDasharray="8 8" />

      {/* Body container for bobbing */}
      <g className="body-container">

        {/* Left arm (small round bump tucked against body) */}
        <g className="arm-left">
          <circle cx="122" cy="200" r="15" fill="#FF3333" stroke="#CC2222" strokeWidth="2" />
        </g>

        {/* Right arm (small round bump tucked against body) */}
        <g className="arm-right">
          <circle cx="278" cy="200" r="15" fill="#FF3333" stroke="#CC2222" strokeWidth="2" />
        </g>

        {/* Main body (red sphere - bigger) */}
        <circle cx="200" cy="195" r="80" fill="#FF3333" stroke="#CC2222" strokeWidth="2.5" />

        {/* Body highlight */}
        <ellipse cx="185" cy="170" rx="35" ry="25" fill="#FF5555" opacity="0.3" />

        {/* Left ear */}
        <circle cx="140" cy="135" r="22" fill="#FF3333" stroke="#CC2222" strokeWidth="2" className="ear-left" />
        <circle cx="140" cy="135" r="12" fill="#FF5555" opacity="0.4" />

        {/* Right ear */}
        <circle cx="260" cy="135" r="22" fill="#FF3333" stroke="#CC2222" strokeWidth="2" className="ear-right" />
        <circle cx="260" cy="135" r="12" fill="#FF5555" opacity="0.4" />

        {/* Left antenna */}
        <g className="antenna-left">
          <line x1="170" y1="115" x2="155" y2="85" stroke="#FF3333" strokeWidth="5" strokeLinecap="round" />
          <circle cx="155" cy="85" r="8" fill="#FF5555" stroke="#CC2222" strokeWidth="1.5" />
          <circle cx="153" cy="83" r="3" fill="#FF8888" opacity="0.6" />
        </g>

        {/* Right antenna */}
        <g className="antenna-right">
          <line x1="230" y1="115" x2="245" y2="85" stroke="#FF3333" strokeWidth="5" strokeLinecap="round" />
          <circle cx="245" cy="85" r="8" fill="#FF5555" stroke="#CC2222" strokeWidth="1.5" />
          <circle cx="243" cy="83" r="3" fill="#FF8888" opacity="0.6" />
        </g>

        {/* Left eye white */}
        <ellipse cx="170" cy="180" rx="20" ry="16" fill="#FFFFFF" stroke="#333333" strokeWidth="1.5" />

        {/* Right eye white */}
        <ellipse cx="230" cy="180" rx="20" ry="16" fill="#FFFFFF" stroke="#333333" strokeWidth="1.5" />

        {/* Left pupil */}
        <ellipse cx="170" cy="180" rx="10" ry="14" fill="#001A4D" className="eye-left" />

        {/* Right pupil */}
        <ellipse cx="230" cy="180" rx="10" ry="14" fill="#001A4D" className="eye-right" />

        {/* Left eye shine */}
        <circle cx="166" cy="176" r="4" fill="#FFFFFF" opacity="0.85" />

        {/* Right eye shine */}
        <circle cx="226" cy="176" r="4" fill="#FFFFFF" opacity="0.85" />

        {/* Mouth (friendly smile) */}
        <path
          d="M 175 230 Q 200 248 225 230"
          stroke="#CC2222"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Feet */}
        <ellipse cx="175" cy="272" rx="22" ry="10" fill="#CC2222" opacity="0.6" />
        <ellipse cx="225" cy="272" rx="22" ry="10" fill="#CC2222" opacity="0.6" />
      </g>
    </svg>
  );
};

export default Molty2D;
