// Everything Beauty — design system constants
// Single source of truth for colors, fonts, spacing, and border radius

// BlurHash for image placeholders (Soft pink/gradient matching branding)
export const UNIVERSAL_BLURHASH = 'LUN#1e}?ysOYS2WXRjS~}tM{%2j@';

export const COLORS = {
    // Brand Pinks
    primary: '#FF6289',        // main buttons, active states, accents
    primaryDark: '#FC3468',    // pressed states, hover, darker accents
    blush: '#FFE6EA',          // light backgrounds, chips, tags
    roseMid: '#FF8A9D',        // secondary accents, softer elements, borders

    // Backgrounds
    background: '#fff9fcff',     // page background
    surface: '#F8F9FA',        // subtle surface, input backgrounds
    surfaceDark: '#1A1A1A',    // cards in dark mode
    bgDark: '#0D0D0D',         // page background dark mode

    // Text
    textDark: '#1A1A1A',       // primary text
    textMuted: '#6C757D',      // secondary/helper text
    textMutedDark: '#B0B0B0',  // secondary text dark mode

    // Borders
    border: '#E9ECEF',         // light mode borders
    borderDark: '#2D2D2D',     // dark mode borders

    // Feedback
    success: '#4ADE80',        // online indicator, verified, success
    warning: '#FFCC00',        // warning states
    error: '#FF3B30',          // error states

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    gold: '#FBBF24',           // ratings stars
    overlay: 'rgba(0,0,0,0.55)',
};

export const FONTS = {
    // Montserrat — glamorous headings, logo, prices, stats, ALL CAPS labels
    montserratBold: 'Montserrat_700Bold',
    montserratExtraBold: 'Montserrat_800ExtraBold',
    montserratRegular: 'Montserrat_400Regular',

    // Playfair Display — editorial, agent names, feature moments
    playfairBold: 'PlayfairDisplay_700Bold',
    playfairItalic: 'PlayfairDisplay_400Regular_Italic',

    // DM Sans — all body text, UI labels, descriptions
    sansRegular: 'DMSans_400Regular',
    sansMedium: 'DMSans_500Medium',
    sansBold: 'DMSans_700Bold',
};

// Apple-style squircle border radius — smooth continuous curves
export const RADIUS = {
    xs: 10,      // small badges, tiny chips
    sm: 16,      // icon containers, small buttons
    md: 20,      // buttons, inputs, small cards
    lg: 28,      // main cards, modals
    xl: 32,      // large cards, bottom sheets (top corners)
    full: 100,   // pills, tags, avatar borders
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 5,
    },
    pink: {
        shadowColor: '#FF6289',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
};

// Spacing tokens used across screens
export const SPACING = {
    screen: 16,
    base: 12,
    gutter: 8,
};

// ─────────────────────────────────────────────────────────────────────────────
// FONT SIZE SCALE — change any value here to update it everywhere in the app
// ─────────────────────────────────────────────────────────────────────────────
export const FONT_SIZE = {
    // Micro labels (badges, tracking letters, ALL-CAPS tags)
    micro: 5,   // category badge text, ALL CAPS tracking labels
    tiny: 10,  // stat labels ("YEARS", "SERVICES"), muted section headers
    xs: 15,  // location text, helper chips, secondary metadata
    sm: 15,  // follow button, small badges, captions
    base: 18,  // action bar labels, description text, small UI copy
    md: 18,  // default body, inputs, button labels
    lg: 19,  // agent name on card, service list title, profile name
    xl: 18,  // section body, bio text
    h4: 18,  // minor headings
    h3: 19,  // service card title (prominent)
    h2: 32,  // section headings, screen sub-titles
    h1: 23,  // price overlay value
    display: 26,  // large prices, hero numbers
    hero: 28,  // agent profile name
    jumbo: 32,  // screen hero titles, splash
};

// ─────────────────────────────────────────────────────────────────────────────
// TEXT_STYLES — ready-to-spread style objects, use like: style={TEXT_STYLES.body}
// These compose FONT_SIZE + FONTS so you only need to import one thing.
// ─────────────────────────────────────────────────────────────────────────────
export const TEXT_STYLES = {
    // ── Micro / label ─────────────────────────────────────────────────────
    /** ALL CAPS badge (e.g. category chip, section tag) */
    badge: { fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.micro, letterSpacing: 1.2, textTransform: 'uppercase' as const },
    /** Muted ALL-CAPS section label (e.g. "YEARS", "SERVICES") */
    statLabel: { fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.tiny, letterSpacing: 2, textTransform: 'uppercase' as const },
    /** Tiny helper / location text */
    helper: { fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.xs },
    /** Small caption below avatars, timestamps */
    caption: { fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.sm },

    // ── Body ──────────────────────────────────────────────────────────────
    /** Default body copy, input field text */
    body: { fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.md, lineHeight: 22 },
    /** Description text on cards, profile bio (slightly smaller) */
    description: { fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.base, lineHeight: 20 },
    /** Medium-weight body for UI labels, tab titles */
    bodyMedium: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZE.md },
    /** Bold body — button text, strong labels */
    bodyBold: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md },

    // ── Agent / card meta ─────────────────────────────────────────────────
    /** Agent name on feed card */
    agentNameCard: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.lg, lineHeight: 19 },
    /** Specialization / role badge text */
    specText: { fontFamily: FONTS.sansMedium, fontSize: FONT_SIZE.sm },

    // ── Service card ──────────────────────────────────────────────────────
    /** Service name — prominent title above media */
    serviceName: { fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.h3, lineHeight: 22 },
    /** Service list item title */
    serviceTitle: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.lg },

    // ── Price / stats ─────────────────────────────────────────────────────
    /** Price overlay on media */
    priceOverlay: { fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.h1, lineHeight: 26 },
    /** Price in service list / detail */
    price: { fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.display },
    /** Stat value (followers, years, rating) */
    statValue: { fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.h2 },

    // ── Headings ──────────────────────────────────────────────────────────
    /** Minor screen heading / section sub-title */
    h4: { fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.h4 },
    /** Card or section heading */
    h3: { fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.h3 },
    /** Screen sub-heading */
    h2: { fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.h2, lineHeight: 26 },
    /** Main screen / modal title */
    h1: { fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.jumbo, lineHeight: 32 },
    /** Hero display text (splash, onboarding) */
    display: { fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.jumbo, lineHeight: 36 },

    // ── Agent profile page ────────────────────────────────────────────────
    /** Agent name on profile screen */
    profileName: { fontFamily: FONTS.playfairBold, fontSize: FONT_SIZE.hero, lineHeight: 32 },

    // ── Buttons ───────────────────────────────────────────────────────────
    /** Standard pill button label */
    btnPrimary: { fontFamily: FONTS.montserratBold, fontSize: FONT_SIZE.md },
    /** Small follow/tag button */
    btnSmall: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.sm },

    // ── Misc ──────────────────────────────────────────────────────────────
    /** "See more / See less" link text */
    seeMore: { fontFamily: FONTS.sansRegular, fontSize: FONT_SIZE.base },
    /** Duration pill text */
    duration: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZE.md },
};

// Legacy alias — kept so old code importing SIZES doesn't break
export const SIZES = FONT_SIZE;

// Legacy TYPOGRAPHY alias
export const TYPOGRAPHY = {
    label: TEXT_STYLES.statLabel,
    title: TEXT_STYLES.h2,
    body: TEXT_STYLES.body,
};

// ─────────────────────────────────────────────────────────────────────────────
// Font usage guide:
//  Logo "everythingbeauty"      → montserratExtraBold
//  Service names on cards       → TEXT_STYLES.serviceName  (playfairBold, h3)
//  Prices                       → TEXT_STYLES.priceOverlay / price
//  Stats (500+, 4.9/5)          → TEXT_STYLES.statValue
//  Agent names on card          → TEXT_STYLES.agentNameCard
//  Agent name on profile        → TEXT_STYLES.profileName
//  Section ALL-CAPS labels      → TEXT_STYLES.statLabel
//  Body / descriptions          → TEXT_STYLES.body / description
//  Helper / muted text          → TEXT_STYLES.helper
//  Bold UI labels               → TEXT_STYLES.bodyBold
//  Button labels                → TEXT_STYLES.btnPrimary / btnSmall
// ─────────────────────────────────────────────────────────────────────────────