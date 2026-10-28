import React from 'react';

/**
 * 2D SVG Vector Shields for the Gamification Ranking System
 * Tiers: 'ferro' | 'bronze' | 'prata' | 'ouro' | 'safira' | 'diamante' | 'lenda'
 */
export default function RankShield2D({ tier = 'bronze', size = 64, className = '', showGlow = true }) {
  const normTier = tier.toLowerCase();

  switch (normTier) {
    case 'ferro':
    case 'iron':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 120"
          className={`drop-shadow-md ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ironGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9ca3af" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="ironInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          {/* Outer Shield */}
          <path
            d="M50 5 L88 20 C88 65 72 98 50 115 C28 98 12 65 12 20 Z"
            fill="url(#ironGrad)"
            stroke="#cbd5e1"
            strokeWidth="3"
          />
          {/* Inner Shield */}
          <path
            d="M50 16 L80 28 C80 62 67 88 50 103 C33 88 20 62 20 28 Z"
            fill="url(#ironInner)"
            stroke="#475569"
            strokeWidth="2"
          />
          {/* Iron Rivets */}
          <circle cx="30" cy="30" r="2.5" fill="#e2e8f0" />
          <circle cx="70" cy="30" r="2.5" fill="#e2e8f0" />
          <circle cx="50" cy="95" r="2.5" fill="#e2e8f0" />
          {/* Central Iron Spike / Dagger */}
          <path d="M50 32 L56 50 L53 78 L50 84 L47 78 L44 50 Z" fill="#cbd5e1" />
          <path d="M42 46 L58 46 L55 50 L45 50 Z" fill="#94a3b8" />
        </svg>
      );

    case 'bronze':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 120"
          className={`drop-shadow-lg ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bronzeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="35%" stopColor="#b45309" />
              <stop offset="70%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="bronzeInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="50%" stopColor="#290e02" />
              <stop offset="100%" stopColor="#1a0701" />
            </linearGradient>
            <linearGradient id="bronzeEmblem" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {showGlow && (
            <path
              d="M50 5 L88 20 C88 65 72 98 50 115 C28 98 12 65 12 20 Z"
              stroke="#d97706"
              strokeWidth="6"
              opacity="0.3"
            />
          )}
          {/* Outer Shield */}
          <path
            d="M50 5 L88 20 C88 65 72 98 50 115 C28 98 12 65 12 20 Z"
            fill="url(#bronzeBorder)"
            stroke="#fbbf24"
            strokeWidth="2.5"
          />
          {/* Inner Shield */}
          <path
            d="M50 15 L79 27 C79 61 66 87 50 102 C34 87 21 61 21 27 Z"
            fill="url(#bronzeInner)"
            stroke="#92400e"
            strokeWidth="2"
          />
          {/* Bronze Wings / Chevrons */}
          <path d="M50 35 L68 45 L50 55 L32 45 Z" fill="url(#bronzeEmblem)" />
          <path d="M50 52 L64 61 L50 70 L36 61 Z" fill="url(#bronzeEmblem)" />
          <path d="M50 67 L60 74 L50 82 L40 74 Z" fill="url(#bronzeEmblem)" />
          {/* Center Rivet */}
          <circle cx="50" cy="45" r="3" fill="#fef3c7" />
        </svg>
      );

    case 'prata':
    case 'silver':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 120"
          className={`drop-shadow-lg ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="silverBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#cbd5e1" />
              <stop offset="70%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="silverInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="silverCross" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          {showGlow && (
            <path
              d="M50 4 L90 20 C90 68 73 100 50 116 C27 100 10 68 10 20 Z"
              stroke="#e2e8f0"
              strokeWidth="5"
              opacity="0.35"
            />
          )}
          {/* Outer Shield */}
          <path
            d="M50 4 L90 20 C90 68 73 100 50 116 C27 100 10 68 10 20 Z"
            fill="url(#silverBorder)"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          {/* Inner Shield */}
          <path
            d="M50 14 L81 27 C81 63 68 90 50 104 C32 90 19 63 19 27 Z"
            fill="url(#silverInner)"
            stroke="#64748b"
            strokeWidth="1.5"
          />
          {/* Silver Cross Emblem */}
          <path d="M47 30 L53 30 L53 47 L70 47 L70 53 L53 53 L53 82 L47 82 L47 53 L30 53 L30 47 L47 47 Z" fill="url(#silverCross)" />
          <circle cx="50" cy="50" r="5" fill="#ffffff" />
          <circle cx="50" cy="50" r="2.5" fill="#475569" />
        </svg>
      );

    case 'ouro':
    case 'gold':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 120"
          className={`drop-shadow-xl ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="25%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="goldInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2e1065" />
              <stop offset="60%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          {showGlow && (
            <path
              d="M50 3 L92 20 C92 70 74 102 50 117 C26 102 8 70 8 20 Z"
              stroke="#fbbf24"
              strokeWidth="6"
              opacity="0.45"
            />
          )}
          {/* Outer Shield with Flares */}
          <path
            d="M50 3 L92 20 C92 70 74 102 50 117 C26 102 8 70 8 20 Z"
            fill="url(#goldBorder)"
            stroke="#fef08a"
            strokeWidth="3"
          />
          {/* Inner Shield */}
          <path
            d="M50 13 L82 27 C82 65 68 92 50 105 C32 92 18 65 18 27 Z"
            fill="url(#goldInner)"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          {/* Golden Crown Emblem */}
          <path
            d="M32 66 L36 44 L44 54 L50 38 L56 54 L64 44 L68 66 Z"
            fill="url(#crownGold)"
            stroke="#fef08a"
            strokeWidth="1.5"
          />
          {/* Crown Jewels */}
          <circle cx="36" cy="42" r="2.5" fill="#ef4444" />
          <circle cx="50" cy="36" r="3" fill="#3b82f6" />
          <circle cx="64" cy="42" r="2.5" fill="#ef4444" />
          {/* Lower Golden Star */}
          <path d="M50 72 L53 79 L60 80 L55 85 L56 92 L50 88 L44 92 L45 85 L40 80 L47 79 Z" fill="#fef08a" />
        </svg>
      );

    case 'safira':
    case 'sapphire':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 120"
          className={`drop-shadow-2xl ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="sapphireBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="30%" stopColor="#3b82f6" />
              <stop offset="70%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="sapphireInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#081028" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bfdbfe" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          {showGlow && (
            <path
              d="M50 2 L93 21 C93 72 75 103 50 118 C25 103 7 72 7 21 Z"
              stroke="#3b82f6"
              strokeWidth="7"
              opacity="0.5"
            />
          )}
          {/* Outer Shield */}
          <path
            d="M50 2 L93 21 C93 72 75 103 50 118 C25 103 7 72 7 21 Z"
            fill="url(#sapphireBorder)"
            stroke="#93c5fd"
            strokeWidth="3"
          />
          {/* Inner Shield */}
          <path
            d="M50 12 L83 27 C83 66 69 93 50 106 C31 93 17 66 17 27 Z"
            fill="url(#sapphireInner)"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          {/* Faceted Sapphire Gem Crystal */}
          <polygon points="50,30 68,44 68,66 50,86 32,66 32,44" fill="url(#gemGrad)" stroke="#dbeafe" strokeWidth="1.5" />
          <polygon points="50,30 50,86 32,44" fill="#3b82f6" opacity="0.6" />
          <polygon points="50,30 68,44 50,86" fill="#1d4ed8" opacity="0.4" />
          <polygon points="42,40 58,40 50,60" fill="#eff6ff" opacity="0.8" />
          {/* Shining Sparkles */}
          <circle cx="50" cy="30" r="2" fill="#ffffff" />
          <circle cx="68" cy="44" r="2" fill="#ffffff" />
          <circle cx="32" cy="44" r="2" fill="#ffffff" />
        </svg>
      );

    case 'diamante':
    case 'diamond':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 120"
          className={`drop-shadow-2xl ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="diamondBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#67e8f9" />
              <stop offset="70%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#cffafe" />
            </linearGradient>
            <linearGradient id="diamondInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#082f49" />
              <stop offset="60%" stopColor="#031b2e" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {showGlow && (
            <path
              d="M50 2 L95 22 C95 73 76 104 50 119 C24 104 5 73 5 22 Z"
              stroke="#22d3ee"
              strokeWidth="8"
              opacity="0.6"
            />
          )}
          {/* Outer Shield with Crystal Horns */}
          <path
            d="M50 2 L95 22 C95 73 76 104 50 119 C24 104 5 73 5 22 Z"
            fill="url(#diamondBorder)"
            stroke="#ffffff"
            strokeWidth="3.5"
          />
          {/* Inner Shield */}
          <path
            d="M50 12 L84 28 C84 68 70 95 50 107 C30 95 16 68 16 28 Z"
            fill="url(#diamondInner)"
            stroke="#22d3ee"
            strokeWidth="2"
          />
          {/* Prismatic Cut Diamond */}
          <polygon points="36,44 64,44 74,56 50,86 26,56" fill="url(#crystalGrad)" stroke="#ffffff" strokeWidth="2" />
          <polygon points="36,44 64,44 50,56" fill="#e0f2fe" opacity="0.9" />
          <polygon points="36,44 26,56 50,56" fill="#0891b2" opacity="0.7" />
          <polygon points="64,44 74,56 50,56" fill="#06b6d4" opacity="0.6" />
          <polygon points="26,56 50,86 50,56" fill="#0284c7" opacity="0.8" />
          <polygon points="74,56 50,86 50,56" fill="#38bdf8" opacity="0.7" />
          {/* Sparkling Flare Stars */}
          <path d="M50 28 L51 33 L56 34 L51 35 L50 40 L49 35 L44 34 L49 33 Z" fill="#ffffff" />
          <path d="M72 40 L73 43 L76 44 L73 45 L72 48 L71 45 L68 44 L71 43 Z" fill="#cffafe" />
        </svg>
      );

    case 'lenda':
    case 'mestre':
    case 'master':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 120"
          className={`drop-shadow-2xl ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="masterBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="25%" stopColor="#ff7a00" />
              <stop offset="60%" stopColor="#ff3d00" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="masterInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a0808" />
              <stop offset="50%" stopColor="#1c0505" />
              <stop offset="100%" stopColor="#080202" />
            </linearGradient>
            <linearGradient id="fireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#ff7a00" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          {showGlow && (
            <path
              d="M50 2 L96 22 C96 74 76 105 50 120 C24 105 4 74 4 22 Z"
              stroke="#ff7a00"
              strokeWidth="9"
              opacity="0.65"
            />
          )}
          {/* Outer Dragon / Phoenix Winged Shield */}
          <path
            d="M50 2 L96 22 C96 74 76 105 50 120 C24 105 4 74 4 22 Z"
            fill="url(#masterBorder)"
            stroke="#fed7aa"
            strokeWidth="3.5"
          />
          {/* Inner Obsidian Shield */}
          <path
            d="M50 11 L85 27 C85 69 71 96 50 108 C29 96 15 69 15 27 Z"
            fill="url(#masterInner)"
            stroke="#ff7a00"
            strokeWidth="2.5"
          />
          {/* Grand Phoenix Wings */}
          <path d="M22 36 C34 38 42 50 44 64 C36 60 28 50 22 36 Z" fill="url(#fireGrad)" opacity="0.85" />
          <path d="M78 36 C66 38 58 50 56 64 C64 60 72 50 78 36 Z" fill="url(#fireGrad)" opacity="0.85" />
          {/* Central Sacred Flame */}
          <path
            d="M50 34 C55 45 62 52 60 66 C58 76 53 82 50 85 C47 82 42 76 40 66 C38 52 45 45 50 34 Z"
            fill="url(#fireGrad)"
          />
          {/* Inner Core Flame */}
          <path
            d="M50 50 C52 56 55 60 54 68 C53 73 51 77 50 79 C49 77 47 73 46 68 C45 60 48 56 50 50 Z"
            fill="#ffffff"
          />
          {/* Master Golden Crown on Top */}
          <path d="M40 32 L44 22 L50 26 L56 22 L60 32 Z" fill="#fbbf24" stroke="#fef08a" strokeWidth="1" />
          <circle cx="50" cy="25" r="2" fill="#ef4444" />
        </svg>
      );
  }
}
