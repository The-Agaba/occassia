export interface InvitationCollection {
  id: string;
  name: string;
  icon: string;
  description: string;
  isAvailableForWedding: boolean;
  comingSoon?: boolean;
}

export const INVITATION_COLLECTIONS: InvitationCollection[] = [
  {
    id: 'wedding-invitations',
    name: 'Wedding Invitations',
    icon: '💒',
    description: 'Timeless, romantic & luxury invitation suites for your wedding day.',
    isAvailableForWedding: true,
  },
  {
    id: 'wedding-save-the-dates',
    name: 'Wedding Save The Dates',
    icon: '💌',
    description: 'Chic announcement cards to reserve your guests calendars in advance.',
    isAvailableForWedding: true,
  },
  {
    id: 'wedding-related',
    name: 'Wedding Related',
    icon: '🥂',
    description: 'Bridal showers, Send-Off parties, Kitchen parties & rehearsal dinners.',
    isAvailableForWedding: true,
  },
  {
    id: 'baby-shower',
    name: 'Baby Shower Invitations',
    icon: '🍼',
    description: 'Joyful, sweet and playful designs for celebrating new life.',
    isAvailableForWedding: false,
    comingSoon: true,
  },
  {
    id: 'birthday-party',
    name: 'Birthday Party Invitations',
    icon: '🎂',
    description: 'Vibrant and festive birthday invites for every milestone.',
    isAvailableForWedding: false,
    comingSoon: true,
  },
  {
    id: 'holiday-cards',
    name: 'Holiday Cards',
    icon: '❄️',
    description: 'Warm seasonal greetings and gratitude stationery.',
    isAvailableForWedding: false,
    comingSoon: true,
  },
  {
    id: 'holiday-party',
    name: 'Holiday Party Invitations',
    icon: '🎉',
    description: 'Celebrate festive company gatherings and seasonal soirees.',
    isAvailableForWedding: false,
    comingSoon: true,
  },
  {
    id: 'christmas-cards',
    name: 'Christmas Cards',
    icon: '🎁',
    description: 'Classic Christmas cheer, gold foil accents and winter wonder.',
    isAvailableForWedding: false,
    comingSoon: true,
  },
  {
    id: 'christmas-invitations',
    name: 'Christmas Invitations',
    icon: '🎄',
    description: 'Festive holiday feasts and family Christmas celebrations.',
    isAvailableForWedding: false,
    comingSoon: true,
  },
  {
    id: 'other-designs',
    name: 'Other Designs',
    icon: '🍿',
    description: 'Custom gala, corporate summit, anniversary and memorial celebrations.',
    isAvailableForWedding: true,
  },
];

export interface CardTemplate {
  id: string;
  collectionId: string;
  title: string;
  subtitle: string;
  artist: string;
  theme: {
    bgGradient: string;
    cardBg: string;
    borderColor: string;
    accentColor: string;
    textColor: string;
    secondaryText: string;
    fontFamily: string;
    envelopeColor: string;
    envelopeFlapColor: string;
    sealColor: string;
    sealEmblem: string;
    paperTexture: string;
    decorStyle: 'botanical' | 'editorial' | 'velvet-emerald' | 'celestial' | 'boho-terracotta' | 'art-deco' | 'tuscan-olive' | 'lavender-pearl' | 'burgundy-crimson' | 'swahili-gold' | 'bridal-peony' | 'kitchen-party';
  };
}

export const CARD_TEMPLATES: CardTemplate[] = [
  // 1. Royal Botanical & Gold Foil
  {
    id: 'royal-botanical-gold',
    collectionId: 'wedding-invitations',
    title: 'Royal Botanical & Gold Foil',
    subtitle: 'Classic ivory parchment framed in hand-gilded golden florals',
    artist: 'Occassia Atelier',
    theme: {
      bgGradient: 'radial-gradient(circle at 50% 30%, #fffbf2 0%, #f7edd8 100%)',
      cardBg: '#faf6ee',
      borderColor: '#d4af37',
      accentColor: '#c59b27',
      textColor: '#1a1915',
      secondaryText: '#706450',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      envelopeColor: '#1c2538',
      envelopeFlapColor: '#141d2d',
      sealColor: '#c59b27',
      sealEmblem: '👑',
      paperTexture: 'textured',
      decorStyle: 'botanical',
    },
  },

  // 2. Minimalist Parisian Editorial
  {
    id: 'minimalist-parisian-editorial',
    collectionId: 'wedding-invitations',
    title: 'Minimalist Parisian Editorial',
    subtitle: 'High-fashion editorial typography with crisp double-lined borders',
    artist: 'Maison Vogue',
    theme: {
      bgGradient: 'linear-gradient(135deg, #ffffff 0%, #f4f4f6 100%)',
      cardBg: '#ffffff',
      borderColor: '#111827',
      accentColor: '#111827',
      textColor: '#0f172a',
      secondaryText: '#64748b',
      fontFamily: "'Playfair Display', Georgia, serif",
      envelopeColor: '#2b2d42',
      envelopeFlapColor: '#1e2030',
      sealColor: '#111827',
      sealEmblem: '✦',
      paperTexture: 'smooth',
      decorStyle: 'editorial',
    },
  },

  // 3. Emerald Velvet & Rose Gold
  {
    id: 'emerald-velvet-rose-gold',
    collectionId: 'wedding-invitations',
    title: 'Emerald Velvet & Rose Gold',
    subtitle: 'Regal deep forest green paired with shimmering rose gold calligraphy',
    artist: 'Botanique Studio',
    theme: {
      bgGradient: 'linear-gradient(145deg, #07251e 0%, #031410 100%)',
      cardBg: '#092a22',
      borderColor: '#e8a598',
      accentColor: '#f3c1b6',
      textColor: '#ffffff',
      secondaryText: '#b3d1c9',
      fontFamily: "'Cinzel', Georgia, serif",
      envelopeColor: '#061a15',
      envelopeFlapColor: '#04130f',
      sealColor: '#e8a598',
      sealEmblem: '🌿',
      paperTexture: 'velvet',
      decorStyle: 'velvet-emerald',
    },
  },

  // 4. Celestial Midnight Blue & Starfall
  {
    id: 'celestial-midnight-stars',
    collectionId: 'wedding-invitations',
    title: 'Celestial Midnight & Starfall',
    subtitle: 'Starlit deep navy with silver foil constellation flourishes',
    artist: 'Cosmos & Co',
    theme: {
      bgGradient: 'radial-gradient(circle at 50% 20%, #172554 0%, #090e1d 100%)',
      cardBg: '#0c1630',
      borderColor: '#93c5fd',
      accentColor: '#60a5fa',
      textColor: '#f8fafc',
      secondaryText: '#94a3b8',
      fontFamily: "'Marcellus', serif",
      envelopeColor: '#0b1329',
      envelopeFlapColor: '#070c1b',
      sealColor: '#60a5fa',
      sealEmblem: '✨',
      paperTexture: 'textured',
      decorStyle: 'celestial',
    },
  },

  // 5. Terracotta Sunset & Pampas Grass
  {
    id: 'terracotta-sunset-boho',
    collectionId: 'wedding-invitations',
    title: 'Terracotta Sunset & Pampas',
    subtitle: 'Earthy warmth, sun-baked desert clay and delicate botanical arches',
    artist: 'Serengeti Dusk',
    theme: {
      bgGradient: 'linear-gradient(150deg, #fdf8f5 0%, #fae8df 100%)',
      cardBg: '#fffbf9',
      borderColor: '#c86d51',
      accentColor: '#b45309',
      textColor: '#3c1810',
      secondaryText: '#875344',
      fontFamily: "'Cormorant Garamond', serif",
      envelopeColor: '#8a3c26',
      envelopeFlapColor: '#6e2f1e',
      sealColor: '#c86d51',
      sealEmblem: '🌾',
      paperTexture: 'textured',
      decorStyle: 'boho-terracotta',
    },
  },

  // 6. Art Deco Gatsby Champagne
  {
    id: 'art-deco-gatsby-champagne',
    collectionId: 'wedding-invitations',
    title: 'Art Deco Great Gatsby Champagne',
    subtitle: '1920s geometric opulence with gold leaf fans and sleek obsidian',
    artist: 'Roaring 20s Atelier',
    theme: {
      bgGradient: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
      cardBg: '#121215',
      borderColor: '#fbbf24',
      accentColor: '#f59e0b',
      textColor: '#fef3c7',
      secondaryText: '#a1a1aa',
      fontFamily: "'Cinzel Decorative', Georgia, serif",
      envelopeColor: '#18181b',
      envelopeFlapColor: '#09090b',
      sealColor: '#fbbf24',
      sealEmblem: '⚜️',
      paperTexture: 'smooth',
      decorStyle: 'art-deco',
    },
  },

  // 7. Tuscan Olive & Handpainted Linen
  {
    id: 'tuscan-olive-linen',
    collectionId: 'wedding-invitations',
    title: 'Tuscan Olive & Italian Linen',
    subtitle: 'Organic watercolor olive wreaths on handcrafted deckled cotton paper',
    artist: 'Villa Bella',
    theme: {
      bgGradient: 'linear-gradient(140deg, #fdfdfc 0%, #f2f4ec 100%)',
      cardBg: '#fafbf7',
      borderColor: '#6b7e54',
      accentColor: '#556b2f',
      textColor: '#1f241a',
      secondaryText: '#5f6854',
      fontFamily: "'Italiana', serif",
      envelopeColor: '#36402d',
      envelopeFlapColor: '#272e20',
      sealColor: '#6b7e54',
      sealEmblem: '🕊️',
      paperTexture: 'linen',
      decorStyle: 'tuscan-olive',
    },
  },

  // 8. Serene Lavender & Pearl Filigree
  {
    id: 'serene-lavender-pearl',
    collectionId: 'wedding-invitations',
    title: 'Serene Lavender & Pearl Filigree',
    subtitle: 'Soft lilac pastels, embossed pearl arches and delicate romantic script',
    artist: 'Lavender Dreams',
    theme: {
      bgGradient: 'radial-gradient(circle at 50% 30%, #faf8ff 0%, #ece6fc 100%)',
      cardBg: '#faf7fe',
      borderColor: '#a78bfa',
      accentColor: '#7c3aed',
      textColor: '#2e1065',
      secondaryText: '#6b7280',
      fontFamily: "'Playfair Display', serif",
      envelopeColor: '#4c1d95',
      envelopeFlapColor: '#3b0764',
      sealColor: '#a78bfa',
      sealEmblem: '🌸',
      paperTexture: 'textured',
      decorStyle: 'lavender-pearl',
    },
  },

  // 9. Burgundy Velvet & Dark Romance
  {
    id: 'burgundy-velvet-romance',
    collectionId: 'wedding-invitations',
    title: 'Burgundy Velvet & Dark Romance',
    subtitle: 'Deep wine crimson with rich cascading floral motifs and gilded script',
    artist: 'Atelier Amor',
    theme: {
      bgGradient: 'linear-gradient(155deg, #2a0812 0%, #150207 100%)',
      cardBg: '#21050d',
      borderColor: '#f43f5e',
      accentColor: '#fb7185',
      textColor: '#fff1f2',
      secondaryText: '#fda4af',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      envelopeColor: '#2b0710',
      envelopeFlapColor: '#1c040a',
      sealColor: '#f43f5e',
      sealEmblem: '🌹',
      paperTexture: 'velvet',
      decorStyle: 'burgundy-crimson',
    },
  },

  // 10. Traditional Swahili Royal Kanga & Gold
  {
    id: 'swahili-royal-kanga-gold',
    collectionId: 'wedding-invitations',
    title: 'Traditional Swahili Royal Kanga & Gold',
    subtitle: 'East African royal celebration motifs, intricate gold lace & festive warmth',
    artist: 'Zanzibar Heritage',
    theme: {
      bgGradient: 'radial-gradient(circle at 50% 25%, #fff9e6 0%, #f7e8b6 100%)',
      cardBg: '#fffdf5',
      borderColor: '#d97706',
      accentColor: '#b45309',
      textColor: '#1c1917',
      secondaryText: '#78350f',
      fontFamily: "'Cinzel', Georgia, serif",
      envelopeColor: '#78350f',
      envelopeFlapColor: '#57260a',
      sealColor: '#d97706',
      sealEmblem: '✨',
      paperTexture: 'textured',
      decorStyle: 'swahili-gold',
    },
  },

  // 11. Wedding Related - Bridal Shower Rose Garden
  {
    id: 'bridal-shower-peony',
    collectionId: 'wedding-related',
    title: 'Bridal Shower Rose Garden',
    subtitle: 'Blushing florals, delicate ribbons and daytime celebration flair',
    artist: 'Occassia Floral',
    theme: {
      bgGradient: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      cardBg: '#ffffff',
      borderColor: '#f43f5e',
      accentColor: '#e11d48',
      textColor: '#881337',
      secondaryText: '#9f1239',
      fontFamily: "'Cormorant Garamond', serif",
      envelopeColor: '#be123c',
      envelopeFlapColor: '#9f1239',
      sealColor: '#fb7185',
      sealEmblem: '💐',
      paperTexture: 'smooth',
      decorStyle: 'bridal-peony',
    },
  },

  // 12. Wedding Related - Kitchen Party & Send-Off Gold
  {
    id: 'kitchen-party-sendoff-gold',
    collectionId: 'wedding-related',
    title: 'Kitchen Party & Send-Off Golden Gala',
    subtitle: 'Vibrant celebration stationery for bridal send-off & traditional festivities',
    artist: 'Tanzania Celebrations',
    theme: {
      bgGradient: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
      cardBg: '#ffffff',
      borderColor: '#f59e0b',
      accentColor: '#d97706',
      textColor: '#451a03',
      secondaryText: '#78350f',
      fontFamily: "'Playfair Display', serif",
      envelopeColor: '#78350f',
      envelopeFlapColor: '#5e2707',
      sealColor: '#f59e0b',
      sealEmblem: '🥂',
      paperTexture: 'textured',
      decorStyle: 'kitchen-party',
    },
  },
];

export function getTemplateById(id: string): CardTemplate {
  return CARD_TEMPLATES.find(t => t.id === id) || CARD_TEMPLATES[0];
}

export const WEDDING_TEMPLATES = CARD_TEMPLATES;
