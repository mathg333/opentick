import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Crown, 
  Upload, 
  Palette,
  ShieldAlert
} from 'lucide-react';
import RankShield2D from './RankShield2D';
import { calculateGamification } from '../utils/gamification';

const COVER_PRESETS = [
  {
    id: 'rain_glass',
    name: 'Chuva no Vidro',
    preview: '/images/bg_rain_glass_dark.png',
    style: { backgroundImage: "url('/images/bg_rain_glass_dark.png')" }
  },
  {
    id: 'sunset_lava',
    name: 'Sunset Lava',
    preview: '',
    style: { background: 'linear-gradient(135deg, #ff7a00, #ff3d00, #991b1b)' }
  },
  {
    id: 'cyber_neon',
    name: 'Cyberpunk Neon',
    preview: '',
    style: { background: 'linear-gradient(135deg, #1e1b4b, #4338ca, #3b82f6)' }
  },
  {
    id: 'sapphire_deep',
    name: 'Safira Mística',
    preview: '',
    style: { background: 'linear-gradient(135deg, #0f172a, #1e3a8a, #2563eb)' }
  },
  {
    id: 'obsidian_dark',
    name: 'Preto Ônix',
    preview: '',
    style: { background: 'linear-gradient(135deg, #09090b, #18181b, #27272a)' }
  },
  {
    id: 'aurora_borealis',
    name: 'Aurora Cósmica',
    preview: '',
    style: { background: 'linear-gradient(135deg, #022c22, #059669, #10b981)' }
  }
];

const AVATAR_PRESETS = [
  '🐺', '🦁', '🦅', '🐸', '🥷', '🧑‍🚀', '🧙‍♂️', '🤖', 
  '🐉', '🐯', '🦊', '👑', '⚡', '💎', '🛡️', '⚔️'
];

export default function ProfileCustomizeModal({ isOpen, onClose, store }) {
  if (!isOpen) return null;

  const { state, updateUserProfile } = store;
  const currentProfile = state.userProfile || {
    name: 'Mathx',
    title: 'Mestre da Produtividade',
    avatar: '🐺',
    avatarType: 'emoji',
    coverPreset: 'rain_glass',
    coverImage: null
  };

  const [name, setName] = useState(currentProfile.name || 'Mathx');
  const [title, setTitle] = useState(currentProfile.title || 'Mestre da Produtividade');
  const [avatar, setAvatar] = useState(currentProfile.avatar || '🐺');
  const [avatarType, setAvatarType] = useState(currentProfile.avatarType || 'emoji');
  const [coverPreset, setCoverPreset] = useState(currentProfile.coverPreset || 'rain_glass');
  const [coverImage, setCoverImage] = useState(currentProfile.coverImage || null);

  const fileInputAvatarRef = useRef(null);
  const fileInputCoverRef = useRef(null);

  const stats = calculateGamification(state);

  const handleUploadAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target.result);
      setAvatarType('image');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage(event.target.result);
      setCoverPreset('custom');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUserProfile({
      name: name.trim() || 'Mathx',
      title: title.trim() || 'Mestre da Produtividade',
      avatar,
      avatarType,
      coverPreset,
      coverImage
    });
    onClose();
  };

  // Helper to get active cover style
  const getCoverStyle = () => {
    if (coverImage) {
      return {
        backgroundImage: `url(${coverImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    const found = COVER_PRESETS.find(p => p.id === coverPreset) || COVER_PRESETS[0];
    return {
      ...found.style,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-[#222226] bg-[#0c0c0e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-base font-bold text-white">Personalizar Perfil & Capa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Interactive Live Preview Card */}
          <div className="rounded-2xl border border-[#27272a] overflow-hidden bg-[#0a0a0c] shadow-xl relative">
            {/* Banner Cover with Dim Overlay */}
            <div 
              className="h-28 sm:h-32 w-full relative transition-all duration-300 flex items-end p-3"
              style={getCoverStyle()}
            >
              <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />
              <button
                onClick={() => fileInputCoverRef.current?.click()}
                className="relative z-10 text-[11px] font-bold text-white bg-black/60 hover:bg-black/80 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow"
              >
                <Camera className="w-3.5 h-3.5 text-[#ff6b00]" />
                Trocar Capa
              </button>
            </div>

            {/* Profile Avatar & Info Row */}
            <div className="px-4 pb-4 pt-0 relative flex items-end justify-between -mt-8">
              {/* Avatar with Camera Icon */}
              <div className="relative group">
                <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-emerald-500 via-amber-500 to-[#ff6b00] p-1 shadow-2xl ring-4 ring-[#0a0a0c]">
                  <div className="w-full h-full rounded-full bg-[#1c1c1e] overflow-hidden flex items-center justify-center font-black text-white text-3xl select-none">
                    {avatarType === 'image' && avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      avatar
                    )}
                  </div>
                </div>

                <button
                  onClick={() => fileInputAvatarRef.current?.click()}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#ff6b00] hover:bg-[#ea580c] text-white flex items-center justify-center shadow-lg border border-black"
                  title="Upload Foto"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 2D Shield Badge & Rank */}
              <div className="flex items-center gap-2 bg-[#18181c] border border-[#27272a] rounded-2xl px-3 py-1.5 shadow-md">
                <RankShield2D tier={stats.currentRank.tier} size={28} />
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block font-medium">Ranking</span>
                  <span className="text-xs font-black text-white">{stats.currentRank.shortName}</span>
                </div>
              </div>
            </div>

            {/* User Title & Bio */}
            <div className="px-4 pb-4">
              <h3 className="text-lg font-black text-white tracking-tight">{name || 'Mathx'}</h3>
              <p className="text-xs text-neutral-400 font-medium">{title || 'Mestre da Produtividade'}</p>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputAvatarRef}
            onChange={handleUploadAvatar}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={fileInputCoverRef}
            onChange={handleUploadCover}
            accept="image/*"
            className="hidden"
          />

          {/* Section 1: Escolha da Capa (Banner) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#ff6b00]" />
                1. Capa do Perfil (Banner)
              </span>
              <button
                onClick={() => fileInputCoverRef.current?.click()}
                className="text-xs text-[#ff6b00] hover:underline font-bold flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                Foto da Galeria
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {COVER_PRESETS.map((preset) => {
                const isSelected = coverPreset === preset.id && !coverImage;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setCoverPreset(preset.id);
                      setCoverImage(null);
                    }}
                    className={`h-16 rounded-xl relative overflow-hidden border transition-all ${
                      isSelected 
                        ? 'border-[#ff6b00] ring-2 ring-[#ff6b00]/40 scale-102' 
                        : 'border-[#27272a] hover:border-neutral-500 opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      ...preset.style,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-center">
                      <span className="text-[10px] font-bold text-white drop-shadow">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ff6b00] flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Foto de Perfil (Avatar) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#ff6b00]" />
                2. Foto de Perfil (Avatar)
              </span>
              <button
                onClick={() => fileInputAvatarRef.current?.click()}
                className="text-xs text-[#ff6b00] hover:underline font-bold flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                Carregar Minha Foto
              </button>
            </div>

            <div className="grid grid-cols-8 gap-2">
              {AVATAR_PRESETS.map((emoji) => {
                const isSelected = avatarType === 'emoji' && avatar === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      setAvatar(emoji);
                      setAvatarType('emoji');
                    }}
                    className={`w-10 h-10 rounded-xl bg-[#18181c] flex items-center justify-center text-xl transition-all border ${
                      isSelected 
                        ? 'border-[#ff6b00] bg-[#ff6b00]/20 scale-110 shadow-lg shadow-[#ff6b00]/25' 
                        : 'border-[#27272a] hover:border-neutral-500 hover:bg-neutral-800'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Nome & Título do Jogador */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
              3. Dados do Jogador
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Mathx"
                  maxLength={25}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Título / Classe do Jogador
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Mestre da Produtividade"
                  maxLength={35}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#222226] bg-[#0c0c0e] flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#ea580c] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6b00]/30 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Salvar Perfil
          </button>
        </div>

      </div>
    </div>
  );
}
