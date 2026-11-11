import React, { useId } from 'react';

/**
 * Custom UI/UX Obsidian + Gold geometric vector emblems for Sala de Conquistas & Insígnias.
 * Replaces generic multi-colored system emojis with bespoke, palette-unified duotone medallions.
 */
export default function AchievementBadge({ id, unlocked = false, size = 26 }) {
  const uid = useId().replace(/:/g, '');
  const gradGold = `achGold_${uid}`;
  const gradCore = `achCore_${uid}`;

  const primary = unlocked ? `url(#${gradGold})` : '#52525b';
  const secondary = unlocked ? `url(#${gradCore})` : '#3f3f46';
  const accent = unlocked ? '#fef08a' : '#71717a';
  const darkCut = unlocked ? '#181405' : '#18181b';

  const renderGlyph = () => {
    switch (id) {
      case 'first_task':
        // Precision archery bullseye with sleek diagonal arrow
        return (
          <g>
            <circle cx="16" cy="16" r="11" fill="none" stroke={primary} strokeWidth="2.1" />
            <circle cx="16" cy="16" r="6.5" fill="none" stroke={secondary} strokeWidth="1.9" opacity="0.9" />
            <circle cx="16" cy="16" r="2.6" fill={primary} />
            {/* Sleek Arrow shaft + feathers */}
            <path d="M16 16 L26.5 5.5" stroke={accent} strokeWidth="2" strokeLinecap="round" />
            <path d="M23.5 5.5 L26.5 5.5 L26.5 8.5" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="16" r="1.2" fill={darkCut} />
          </g>
        );

      case 'task_spree':
        // Faceted velocity lightning crest with subtle speed accents
        return (
          <g>
            <path
              d="M17.5 3.5 L7.5 17 H15 L13.5 28.5 L24.5 14 H16.8 L17.5 3.5 Z"
              fill={primary}
              stroke={accent}
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
            <path
              d="M16.6 8.2 L11.5 15.6 H16.3 L15.5 22.8"
              fill="none"
              stroke={darkCut}
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.45"
            />
            <circle cx="25.5" cy="7" r="1.3" fill={accent} opacity="0.85" />
            <circle cx="6.5" cy="24.5" r="1.1" fill={accent} opacity="0.7" />
          </g>
        );

      case 'pomodoro_starter':
        // Precision obsidian-gold focus chronograph / deep-work dial
        return (
          <g>
            <rect x="13" y="3.5" width="6" height="2.4" rx="1.2" fill={accent} />
            <path d="M16 5.9 V7.8" stroke={primary} strokeWidth="1.8" />
            <circle cx="16" cy="17.5" r="9.8" fill="none" stroke={primary} strokeWidth="2.1" />
            <circle cx="16" cy="17.5" r="6.8" fill={secondary} opacity="0.18" />
            {/* Focus arc */}
            <path
              d="M16 10.2 A7.3 7.3 0 1 1 9.5 20.8"
              fill="none"
              stroke={accent}
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            {/* Hands */}
            <path d="M16 17.5 V12.8 M16 17.5 L20.2 19.6" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="17.5" r="1.7" fill={primary} />
          </g>
        );

      case 'habit_master':
        // Sculpted layered flame crest
        return (
          <g>
            <path
              d="M16.2 3.5 C16.2 3.5 24.5 10.2 24.5 18.2 C24.5 23.6 20.7 28 16 28 C11.1 28 7.5 24 7.5 18.5 C7.5 14.3 9.7 11.4 11.4 9.5 C11.6 12.2 13.1 13.4 13.1 13.4 C12.4 9.4 14.3 5.7 16.2 3.5 Z"
              fill={primary}
              stroke={accent}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M16 14.5 C16 14.5 19.8 17.6 19.8 21.1 C19.8 23.6 18.1 25.4 16 25.4 C13.9 25.4 12.2 23.6 12.2 21.2 C12.2 18.8 14 16.5 16 14.5 Z"
              fill={darkCut}
              opacity="0.55"
            />
            <path
              d="M16 16.4 C16 16.4 18.4 18.7 18.4 21.1 C18.4 22.8 17.3 24 16 24 C14.7 24 13.6 22.8 13.6 21.1 C13.6 19.2 15 17.5 16 16.4 Z"
              fill={accent}
            />
          </g>
        );

      case 'silver_rank':
        // Faceted knight shield crest with chevron core
        return (
          <g>
            <path
              d="M16 4 L25.5 7.6 V15.4 C25.5 21.8 21.3 26.2 16 28.2 C10.7 26.2 6.5 21.8 6.5 15.4 V7.6 L16 4 Z"
              fill={secondary}
              fillOpacity="0.22"
              stroke={primary}
              strokeWidth="2.1"
              strokeLinejoin="round"
            />
            <path
              d="M16 7.5 L22.2 9.9 V15.3 C22.2 19.9 19.3 23.1 16 24.7"
              fill="none"
              stroke={accent}
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M11.6 14.5 L16 18.5 L20.4 14.5 M11.6 18.6 L16 22.5 L20.4 18.6"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'gold_master':
        // Five-pointed royal commander crown with faceted band
        return (
          <g>
            <path
              d="M5.5 22 L4.5 10.5 L10.8 15.6 L16 7.5 L21.2 15.6 L27.5 10.5 L26.5 22 H5.5 Z"
              fill={primary}
              stroke={accent}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <rect x="6" y="23.6" width="20" height="3" rx="1.5" fill={accent} />
            <circle cx="16" cy="6.2" r="1.6" fill={accent} />
            <circle cx="4.5" cy="9.2" r="1.4" fill={accent} />
            <circle cx="27.5" cy="9.2" r="1.4" fill={accent} />
            <polygon points="16,13.5 18,16.8 16,19.8 14,16.8" fill={darkCut} opacity="0.65" />
          </g>
        );

      case 'ruby_sovereign':
      default:
        // Geometric sovereign cut gem in cohesive imperial gold
        return (
          <g>
            <polygon
              points="10,6 22,6 27.5,12.8 16,27 4.5,12.8"
              fill={secondary}
              fillOpacity="0.24"
              stroke={primary}
              strokeWidth="2.1"
              strokeLinejoin="round"
            />
            <path
              d="M4.8 12.8 H27.2 M10 6 L12.5 12.8 L16 26.5 L19.5 12.8 L22 6 M12.5 12.8 L16 6 L19.5 12.8"
              fill="none"
              stroke={accent}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <polygon points="16,12.8 19.5,12.8 16,22.2 12.5,12.8" fill={primary} opacity="0.85" />
          </g>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="shrink-0 drop-shadow-[0_2px_6px_rgba(250,204,21,0.22)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradGold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id={gradCore} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      {renderGlyph()}
    </svg>
  );
}
