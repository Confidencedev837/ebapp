// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./src/**/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: "#FF6289",
                primaryDark: "#FC3468",
                blush: "#FFE6EA",
                roseMid: "#FF8A9D",
                background: "#FFFFFF",
                surface: "#F8F9FA",
                surfaceDark: "#1A1A1A",
                bgDark: "#0D0D0D",
                textDark: "#1A1A1A",
                textMuted: "#6C757D",
                textMutedDark: "#B0B0B0",
                border: "#E9ECEF",
                borderDark: "#2D2D2D",
                success: "#4ADE80",
                warning: "#FFCC00",
                error: "#FF3B30",
                gold: "#F5C97A", // Keeping gold for ratings
                white: "#FFFFFF",
                black: "#000000",
            },
            fontFamily: {
                montserrat: ["Montserrat_400Regular"],
                montserratBold: ["Montserrat_700Bold"],
                montserratExtraBold: ["Montserrat_800ExtraBold"],
                playfair: ["PlayfairDisplay_700Bold"],
                playfairItalic: ["PlayfairDisplay_400Regular_Italic"],
                sans: ["DMSans_400Regular"],
                sansMedium: ["DMSans_500Medium"],
                sansBold: ["DMSans_700Bold"],
            },
            borderRadius: {
                xs: "10px",
                sm: "16px",
                md: "20px",
                lg: "28px",
                xl: "32px",
                full: "100px",
            }
        },
    },
    plugins: [],
};
