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
  },
  {
    id: 'birthday-party',
    name: 'Birthday Party Invitations',
    icon: '🎂',
    description: 'Vibrant and festive birthday invites for every milestone.',
    isAvailableForWedding: false,
  },
  {
    id: 'holiday-cards',
    name: 'Holiday Cards',
    icon: '❄️',
    description: 'Warm seasonal greetings and gratitude stationery.',
    isAvailableForWedding: false,
  },
  {
    id: 'holiday-party',
    name: 'Holiday Party Invitations',
    icon: '🎉',
    description: 'Celebrate festive company gatherings and seasonal soirees.',
    isAvailableForWedding: false,
  },
  {
    id: 'christmas-cards',
    name: 'Christmas Cards',
    icon: '🎁',
    description: 'Classic Christmas cheer, gold foil accents and winter wonder.',
    isAvailableForWedding: false,
  },
  {
    id: 'christmas-invitations',
    name: 'Christmas Invitations',
    icon: '🎄',
    description: 'Festive holiday feasts and family Christmas celebrations.',
    isAvailableForWedding: false,
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
  supportsImage?: boolean;
  defaultImage?: string;
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
    decorStyle: string;
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

  // 13. Wedding Photo Suite - Light Corner Frame (From Screenshot)
  {
    id: 'wedding-light-corner-frame',
    collectionId: 'wedding-invitations',
    title: 'Light Corner Frame Photo Suite',
    subtitle: 'Central couple photograph framed with gold geometric cornerlines and overlaid typography',
    artist: 'Jessica Williams',
    supportsImage: true,
    defaultImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    theme: {
      bgGradient: 'linear-gradient(180deg, #181c24 0%, #0d1017 100%)',
      cardBg: '#121620',
      borderColor: '#d4af37',
      accentColor: '#f3c766',
      textColor: '#ffffff',
      secondaryText: '#e2e8f0',
      fontFamily: "'Playfair Display', serif",
      envelopeColor: '#121620',
      envelopeFlapColor: '#0a0d14',
      sealColor: '#d4af37',
      sealEmblem: '💍',
      paperTexture: 'smooth',
      decorStyle: 'photo-corner-gold',
    },
  },

  // 14. Wedding Photo Suite - Modern Arch Portrait
  {
    id: 'wedding-modern-arch-portrait',
    collectionId: 'wedding-invitations',
    title: 'Modern Arch Portrait Suite',
    subtitle: 'Full-bleed romantic couple photography with delicate gold serif typography',
    artist: 'Occassia Modern',
    supportsImage: true,
    defaultImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    theme: {
      bgGradient: 'linear-gradient(135deg, #fbf7f0 0%, #f0e6d6 100%)',
      cardBg: '#fefcf8',
      borderColor: '#c59b27',
      accentColor: '#b8860b',
      textColor: '#292524',
      secondaryText: '#57534e',
      fontFamily: "'Cormorant Garamond', serif",
      envelopeColor: '#292524',
      envelopeFlapColor: '#1c1917',
      sealColor: '#c59b27',
      sealEmblem: '✨',
      paperTexture: 'smooth',
      decorStyle: 'photo-arch',
    },
  },

  // 15. Wedding Related Photo - Chic Snapshot & Send-Off Party
  {
    id: 'wedding-related-chic-snapshot',
    collectionId: 'wedding-related',
    title: 'Chic Polaroid Send-Off & Kitchen Party',
    subtitle: 'Celebratory candid photo card with handwritten script accents and festive sparkles',
    artist: 'Swahili Chic Studio',
    supportsImage: true,
    defaultImage: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80',
    theme: {
      bgGradient: 'linear-gradient(145deg, #fff7ed 0%, #ffedd5 100%)',
      cardBg: '#ffffff',
      borderColor: '#fb923c',
      accentColor: '#ea580c',
      textColor: '#431407',
      secondaryText: '#7c2d12',
      fontFamily: "'Playfair Display', serif",
      envelopeColor: '#c2410c',
      envelopeFlapColor: '#9a3412',
      sealColor: '#fb923c',
      sealEmblem: '📸',
      paperTexture: 'smooth',
      decorStyle: 'photo-corner-gold',
    },
  },

  // 16. Save The Dates - Minimalist Photo
  {
    id: 'save-the-date-photo-modern',
    collectionId: 'wedding-save-the-dates',
    title: 'Minimalist Photo Save The Date',
    subtitle: 'Clean photographic announcement with date stamp and luxury foil trim',
    artist: 'Atelier Noir',
    supportsImage: true,
    defaultImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
    theme: {
      bgGradient: 'linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)',
      cardBg: '#1c1917',
      borderColor: '#e7e5e4',
      accentColor: '#d6d3d1',
      textColor: '#ffffff',
      secondaryText: '#d6d3d1',
      fontFamily: "'Montserrat', sans-serif",
      envelopeColor: '#292524',
      envelopeFlapColor: '#1c1917',
      sealColor: '#e7e5e4',
      sealEmblem: '💌',
      paperTexture: 'smooth',
      decorStyle: 'photo-corner-gold',
    },
  },

  // 17. Baby Shower - Sweet Starlight
  {
    id: 'baby-shower-starlight',
    collectionId: 'baby-shower',
    title: 'Sweet Starlight Baby Shower',
    subtitle: 'Soft pastel mint and golden clouds welcoming your new bundle of joy',
    artist: 'Little Dreamer Atelier',
    theme: {
      bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      cardBg: '#ffffff',
      borderColor: '#10b981',
      accentColor: '#059669',
      textColor: '#064e3b',
      secondaryText: '#047857',
      fontFamily: "'Cormorant Garamond', serif",
      envelopeColor: '#047857',
      envelopeFlapColor: '#064e3b',
      sealColor: '#34d399',
      sealEmblem: '🍼',
      paperTexture: 'smooth',
      decorStyle: 'baby-clouds',
    },
  },

  // 18. Birthday Party - Golden Milestone
  {
    id: 'birthday-milestone-gold',
    collectionId: 'birthday-party',
    title: 'Golden Milestone Birthday Soirée',
    subtitle: 'Sparkling confetti and champagne gold accents for unforgettable celebrations',
    artist: 'Vibrant Gala Studio',
    theme: {
      bgGradient: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 100%)',
      cardBg: '#0f172a',
      borderColor: '#f59e0b',
      accentColor: '#fbbf24',
      textColor: '#ffffff',
      secondaryText: '#cbd5e1',
      fontFamily: "'Cinzel', serif",
      envelopeColor: '#1e1b4b',
      envelopeFlapColor: '#0f172a',
      sealColor: '#f59e0b',
      sealEmblem: '🎂',
      paperTexture: 'smooth',
      decorStyle: 'birthday-confetti',
    },
  },

  // 19. Holiday Cards - Evergreen Pine & Berry
  {
    id: 'holiday-card-evergreen',
    collectionId: 'holiday-cards',
    title: 'Evergreen Pine & Berry Holiday Card',
    subtitle: 'Warm festive greetings with delicate botanical pine and winter berry borders',
    artist: 'Winter Botanica',
    theme: {
      bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      cardBg: '#ffffff',
      borderColor: '#15803d',
      accentColor: '#166534',
      textColor: '#14532d',
      secondaryText: '#15803d',
      fontFamily: "'Playfair Display', serif",
      envelopeColor: '#166534',
      envelopeFlapColor: '#14532d',
      sealColor: '#dc2626',
      sealEmblem: '❄️',
      paperTexture: 'textured',
      decorStyle: 'holiday-evergreen',
    },
  },

  // 20. Holiday Party - Midnight Shimmer
  {
    id: 'holiday-party-midnight',
    collectionId: 'holiday-party',
    title: 'Midnight Sparkle Holiday Soirée',
    subtitle: 'Silver confetti and obsidian night for company parties and festive galas',
    artist: 'Nocturne Designs',
    theme: {
      bgGradient: 'linear-gradient(180deg, #090d16 0%, #020617 100%)',
      cardBg: '#090d16',
      borderColor: '#94a3b8',
      accentColor: '#cbd5e1',
      textColor: '#ffffff',
      secondaryText: '#94a3b8',
      fontFamily: "'Cinzel', serif",
      envelopeColor: '#020617',
      envelopeFlapColor: '#000000',
      sealColor: '#e2e8f0',
      sealEmblem: '🎉',
      paperTexture: 'smooth',
      decorStyle: 'holiday-midnight',
    },
  },

  // 21. Christmas Cards - Victorian Crimson Gold
  {
    id: 'christmas-card-crimson',
    collectionId: 'christmas-cards',
    title: 'Victorian Crimson Gold Christmas Card',
    subtitle: 'Deep crimson velvet with gilded holly wreath typography and classic cheer',
    artist: 'Heritage Noel',
    theme: {
      bgGradient: 'radial-gradient(circle at 50% 30%, #7f1d1d 0%, #450a0a 100%)',
      cardBg: '#450a0a',
      borderColor: '#fbbf24',
      accentColor: '#f59e0b',
      textColor: '#ffffff',
      secondaryText: '#fde68a',
      fontFamily: "'Playfair Display', serif",
      envelopeColor: '#450a0a',
      envelopeFlapColor: '#2b0606',
      sealColor: '#fbbf24',
      sealEmblem: '🎁',
      paperTexture: 'textured',
      decorStyle: 'christmas-noel',
    },
  },

  // 22. Christmas Invitations - Festive Hearth
  {
    id: 'christmas-invitation-hearth',
    collectionId: 'christmas-invitations',
    title: 'Festive Hearth Christmas Dinner',
    subtitle: 'Warm candlelight, pine garlands and golden glow for family Christmas feasts',
    artist: 'St. Nicholas Suite',
    theme: {
      bgGradient: 'linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)',
      cardBg: '#ffffff',
      borderColor: '#b91c1c',
      accentColor: '#991b1b',
      textColor: '#7f1d1d',
      secondaryText: '#991b1b',
      fontFamily: "'Cormorant Garamond', serif",
      envelopeColor: '#991b1b',
      envelopeFlapColor: '#7f1d1d',
      sealColor: '#d97706',
      sealEmblem: '🎄',
      paperTexture: 'smooth',
      decorStyle: 'christmas-hearth',
    },
  },

  // 23. Other Designs - Executive Leadership Summit & Gala
  {
    id: 'other-designs-executive',
    collectionId: 'other-designs',
    title: 'Executive Leadership Summit & Gala',
    subtitle: 'Obsidian & copper geometric lines for corporate award galas, keynotes and summits',
    artist: 'Occassia Executive',
    theme: {
      bgGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      cardBg: '#0f172a',
      borderColor: '#ca8a04',
      accentColor: '#eab308',
      textColor: '#ffffff',
      secondaryText: '#cbd5e1',
      fontFamily: "'Montserrat', sans-serif",
      envelopeColor: '#0f172a',
      envelopeFlapColor: '#020617',
      sealColor: '#ca8a04',
      sealEmblem: '👔',
      paperTexture: 'smooth',
      decorStyle: 'executive-geometric',
    },
  },
];

export function getTemplateById(id: string): CardTemplate {
  return CARD_TEMPLATES.find(t => t.id === id) || CARD_TEMPLATES[0];
}

export const WEDDING_TEMPLATES = CARD_TEMPLATES;
