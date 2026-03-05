// Everything Beauty — design system constants
// Single source of truth for colors, fonts, spacing, and border radius

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

// Font usage guide:
// Logo "everythingbeauty"     → montserratExtraBold
// Service names on cards      → montserratBold
// Prices                      → montserratBold
// Stats (500+, 4.9/5)         → montserratExtraBold
// Agent names                 → playfairBold
// Section taglines            → playfairItalic
// ALL CAPS section labels     → montserratBold, letterSpacing: 3
// Body / descriptions         → sansRegular
// Helper / muted text         → sansRegular
// Bold UI labels              → sansBold