export type StarTier = 'high' | 'mid' | 'low';

export interface StarBandPreset {
  id: string;
  text: string;
  tier: StarTier;
  wordCount: number;
}

export const STAR_BAND_PRESETS: StarBandPreset[] = [
  // High Tier (4.5 – 5 stars): Celebratory & High Praise (~7 presets)
  {
    id: 'high-1',
    tier: 'high',
    text: 'Amazing work this week! Keep shining! ⭐',
    wordCount: 6,
  },
  {
    id: 'high-2',
    tier: 'high',
    text: 'Outstanding recitation! You are a true star! 🌟',
    wordCount: 7,
  },
  {
    id: 'high-3',
    tier: 'high',
    text: 'Brilliant effort! Your hard work is paying off! 🏆',
    wordCount: 8,
  },
  {
    id: 'high-4',
    tier: 'high',
    text: 'Superstar performance! Keep up the golden standard! ✨',
    wordCount: 7,
  },
  {
    id: 'high-5',
    tier: 'high',
    text: 'Magnificent dedication this week! Truly proud of you! 💖',
    wordCount: 8,
  },
  {
    id: 'high-6',
    tier: 'high',
    text: 'Exceptional memorization and focus! Simply wonderful! 🌟',
    wordCount: 6,
  },
  {
    id: 'high-7',
    tier: 'high',
    text: 'Perfect determination! You reached the very top! 🚀',
    wordCount: 7,
  },

  // Mid Tier (2.5 – 4 stars): Positive Encouragement (~7 presets)
  {
    id: 'mid-1',
    tier: 'mid',
    text: 'Great effort! A little more to reach the top! 💪',
    wordCount: 9,
  },
  {
    id: 'mid-2',
    tier: 'mid',
    text: 'Wonderful progress! You are getting stronger every day! 🌱',
    wordCount: 8,
  },
  {
    id: 'mid-3',
    tier: 'mid',
    text: 'Good work this week! Keep climbing higher! 🧗',
    wordCount: 7,
  },
  {
    id: 'mid-4',
    tier: 'mid',
    text: 'Steadily improving! Keep this great momentum going! 🎯',
    wordCount: 7,
  },
  {
    id: 'mid-5',
    tier: 'mid',
    text: 'Well done! Practice daily to reach 5 stars! ⭐',
    wordCount: 8,
  },
  {
    id: 'mid-6',
    tier: 'mid',
    text: 'Strong dedication! The top star is within reach! 🌈',
    wordCount: 8,
  },
  {
    id: 'mid-7',
    tier: 'mid',
    text: 'Proud of your steps forward! Keep aiming high! 🚀',
    wordCount: 8,
  },

  // Low Tier (0 – 2 stars): Gentle, Supportive Encouragement (~7 presets)
  {
    id: 'low-1',
    tier: 'low',
    text: "You can do it! Let's try together this week! 💪",
    wordCount: 9,
  },
  {
    id: 'low-2',
    tier: 'low',
    text: 'Every single step counts! Keep your heart bright! 🌟',
    wordCount: 8,
  },
  {
    id: 'low-3',
    tier: 'low',
    text: 'A fresh week awaits! We believe in you! 🌸',
    wordCount: 8,
  },
  {
    id: 'low-4',
    tier: 'low',
    text: 'Keep trying and never give up! You will shine! 💫',
    wordCount: 9,
  },
  {
    id: 'low-5',
    tier: 'low',
    text: 'Practice makes better! One ayah at a time! 📖',
    wordCount: 8,
  },
  {
    id: 'low-6',
    tier: 'low',
    text: 'Start fresh and do your best this week! 🎈',
    wordCount: 8,
  },
  {
    id: 'low-7',
    tier: 'low',
    text: "Your effort matters most! Let's build together! ☀️",
    wordCount: 7,
  },
];

export function getTierForStars(stars: number): StarTier {
  if (stars >= 4.5) return 'high';
  if (stars >= 2.5) return 'mid';
  return 'low';
}

export function getTierLabel(tier: StarTier): string {
  switch (tier) {
    case 'high':
      return 'Celebratory (4.5–5 ★)';
    case 'mid':
      return 'Encouraging (2.5–4 ★)';
    case 'low':
      return 'Supportive (0–2 ★)';
  }
}

export function getPresetsByTier(tier: StarTier): StarBandPreset[] {
  return STAR_BAND_PRESETS.filter((p) => p.tier === tier);
}

/**
 * Returns a stable dynamic motivational title for the given star level
 * based on student ID and week key (deterministic hash), or default index
 */
export function getDefaultMotivationalTitle(stars: number, seedKey?: string): string {
  const tier = getTierForStars(stars);
  const tierPresets = getPresetsByTier(tier);
  if (tierPresets.length === 0) return 'Great work this week! ⭐';

  if (seedKey) {
    let hash = 0;
    for (let i = 0; i < seedKey.length; i++) {
      hash = (hash << 5) - hash + seedKey.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % tierPresets.length;
    return tierPresets[index].text;
  }

  return tierPresets[0].text;
}
