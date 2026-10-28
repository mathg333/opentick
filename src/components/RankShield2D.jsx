import React from 'react';

/**
 * 3D RPG Shield Assets (PNG Transparent) for Gamification Ranking System
 * Tiers: 'ferro' | 'bronze' | 'prata' | 'ouro' | 'safira' | 'diamante' | 'rubi'
 */
const SHIELD_MAP = {
  ferro: '/shields/shield_ferro_3d.png',
  iron: '/shields/shield_ferro_3d.png',
  bronze: '/shields/shield_bronze_3d.png',
  prata: '/shields/shield_prata_3d.png',
  silver: '/shields/shield_prata_3d.png',
  ouro: '/shields/shield_ouro_3d.png',
  gold: '/shields/shield_ouro_3d.png',
  safira: '/shields/shield_safira_3d.png',
  sapphire: '/shields/shield_safira_3d.png',
  diamante: '/shields/shield_diamante_3d.png',
  diamond: '/shields/shield_diamante_3d.png',
  rubi: '/shields/shield_rubi_3d.png',
  ruby: '/shields/shield_rubi_3d.png',
  lenda: '/shields/shield_rubi_3d.png'
};

const GLOW_MAP = {
  ferro: 'drop-shadow-[0_4px_10px_rgba(148,163,184,0.35)]',
  bronze: 'drop-shadow-[0_4px_14px_rgba(217,119,6,0.45)]',
  prata: 'drop-shadow-[0_4px_16px_rgba(226,232,240,0.5)]',
  ouro: 'drop-shadow-[0_4px_18px_rgba(245,158,11,0.55)]',
  safira: 'drop-shadow-[0_4px_18px_rgba(59,130,246,0.6)]',
  diamante: 'drop-shadow-[0_4px_20px_rgba(34,211,238,0.65)]',
  rubi: 'drop-shadow-[0_4px_22px_rgba(239,68,68,0.7)]',
  lenda: 'drop-shadow-[0_4px_22px_rgba(239,68,68,0.7)]'
};

export default function RankShield2D({ tier = 'bronze', size = 64, className = '', showGlow = true }) {
  const normTier = tier.toLowerCase();
  const src = SHIELD_MAP[normTier] || SHIELD_MAP.bronze;
  const glow = showGlow ? (GLOW_MAP[normTier] || GLOW_MAP.bronze) : '';

  return (
    <img
      src={src}
      alt={`Escudo 3D de ${normTier}`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`object-contain select-none transition-transform duration-300 hover:scale-105 ${glow} ${className}`}
      loading="eager"
    />
  );
}
