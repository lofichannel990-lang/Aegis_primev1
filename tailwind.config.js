/** @type {import('tailwindcss').Config} */
// ============================================================
//  AEGIS PRIME — tailwind.config.js
//  Works with both CDN (via tailwind.config = {}) and
//  Vite/PostCSS build pipelines.
// ============================================================
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      // ── Brand colours ──────────────────────────────────
      colors: {
        brand: {
          bg:        "#050505",       // midnight black base
          surface:   "#0a0a12",       // raised surfaces
          border:    "rgba(255,255,255,0.08)",
          violet: {
            DEFAULT: "#7c3aed",
            light:   "#a78bfa",
            dark:    "#4c1d95",
            glow:    "rgba(139,92,246,0.4)",
          },
          gold: {
            DEFAULT: "#f59e0b",
            light:   "#fcd34d",
            dark:    "#d97706",
            glow:    "rgba(245,158,11,0.4)",
          },
        },
      },

      // ── Typography ──────────────────────────────────────
      fontFamily: {
        sans:    ["Space Grotesk", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },

      // ── Glow shadows ───────────────────────────────────
      boxShadow: {
        "glow-violet":    "0 0 20px rgba(139,92,246,0.45), 0 0 60px rgba(139,92,246,0.12)",
        "glow-violet-sm": "0 0 8px  rgba(139,92,246,0.5)",
        "glow-gold":      "0 0 20px rgba(245,158,11,0.45),  0 0 60px rgba(245,158,11,0.12)",
        "glow-gold-sm":   "0 0 8px  rgba(245,158,11,0.5)",
        "glass":          "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        "glass-lg":       "0 16px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        "panel":          "0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04)",
      },

      // ── Backdrop blur ───────────────────────────────────
      backdropBlur: {
        xs:   "4px",
        sm:   "8px",
        md:   "16px",
        lg:   "24px",
        xl:   "40px",
        "2xl":"60px",
      },

      // ── Gradients (via backgroundImage) ────────────────
      backgroundImage: {
        "gradient-violet":    "linear-gradient(135deg, #7c3aed, #4c1d95)",
        "gradient-gold":      "linear-gradient(135deg, #f59e0b, #d97706)",
        "gradient-vip":       "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #f59e0b 100%)",
        "gradient-glass":     "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
        "gradient-radial-v":  "radial-gradient(circle at 30% 20%, rgba(124,58,237,0.25), transparent 60%)",
        "gradient-radial-g":  "radial-gradient(circle at 70% 80%, rgba(245,158,11,0.15), transparent 60%)",
        "noise-grid":         "linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px)",
      },

      // ── Animations ──────────────────────────────────────
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%":      { opacity: "1",   transform: "scale(1.05)" },
        },
        "float-up": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
        "wave": {
          "0%, 100%": { height: "8px" },
          "50%":      { height: "22px" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 16px rgba(139,92,246,0.4)" },
          "50%":      { boxShadow: "0 0 32px rgba(139,92,246,0.8), 0 0 64px rgba(139,92,246,0.2)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "typing": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
        "ping-slow": {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
      },

      animation: {
        "pulse-slow":     "pulse-slow 4s ease-in-out infinite",
        "float-up":       "float-up 4s ease-in-out infinite",
        "slide-up":       "slide-up 0.35s ease forwards",
        "slide-in-right": "slide-in-right 0.3s ease forwards",
        "shimmer":        "shimmer 2.5s linear infinite",
        "wave":           "wave 1.1s ease-in-out infinite",
        "glow-pulse":     "glow-pulse 2.5s ease-in-out infinite",
        "spin-slow":      "spin-slow 3s linear infinite",
        "typing":         "typing 1s step-end infinite",
        "ping-slow":      "ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
      },

      // ── Border radius ───────────────────────────────────
      borderRadius: {
        "2xl":  "16px",
        "3xl":  "24px",
        "4xl":  "32px",
      },

      // ── Spacing extras ──────────────────────────────────
      spacing: {
        "4.5":  "18px",
        "13":   "52px",
        "18":   "72px",
        "88":   "352px",
        "128":  "512px",
      },

      // ── Z-index ─────────────────────────────────────────
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },

      // ── Screen breakpoints ──────────────────────────────
      screens: {
        "xs":  "375px",
        "sm":  "640px",
        "md":  "768px",
        "lg":  "1024px",
        "xl":  "1280px",
        "2xl": "1536px",
      },

      // ── Transitions ─────────────────────────────────────
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
        "600": "600ms",
      },

      transitionTimingFunction: {
        "spring":     "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },

  plugins: [
    // ── Custom utilities plugin ─────────────────────────
    function({ addUtilities, addComponents, theme }) {
      // Glassmorphism component
      addComponents({
        ".glass": {
          background:     "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(20px)",
          "-webkit-backdrop-filter": "blur(20px)",
          border:         "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow:      "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        },
        ".glass-violet": {
          background:     "rgba(124, 58, 237, 0.08)",
          backdropFilter: "blur(20px)",
          "-webkit-backdrop-filter": "blur(20px)",
          border:         "1px solid rgba(139, 92, 246, 0.2)",
          boxShadow:      "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(139,92,246,0.1)",
        },
        ".glass-gold": {
          background:     "rgba(245, 158, 11, 0.08)",
          backdropFilter: "blur(20px)",
          "-webkit-backdrop-filter": "blur(20px)",
          border:         "1px solid rgba(245, 158, 11, 0.2)",
          boxShadow:      "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(245,158,11,0.1)",
        },
        ".text-gradient-vip": {
          background:               "linear-gradient(135deg, #a78bfa, #f59e0b)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          backgroundClip:           "text",
        },
        ".text-gradient-violet": {
          background:               "linear-gradient(135deg, #c4b5fd, #7c3aed)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          backgroundClip:           "text",
        },
        ".btn-primary": {
          display:         "inline-flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "8px",
          padding:         "10px 20px",
          borderRadius:    "12px",
          fontWeight:      "700",
          fontSize:        "13px",
          transition:      "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          background:      "linear-gradient(135deg, #7c3aed, #6d28d9)",
          color:           "white",
          border:          "1px solid rgba(139,92,246,0.3)",
          boxShadow:       "0 0 20px rgba(139,92,246,0.3)",
          cursor:          "pointer",
          "&:hover": {
            transform:   "translateY(-1px)",
            boxShadow:   "0 0 30px rgba(139,92,246,0.5)",
          },
          "&:active": {
            transform:   "translateY(0)",
          },
          "&:disabled": {
            opacity:         "0.4",
            cursor:          "not-allowed",
            transform:       "none",
          },
        },
      });

      // Glow text utility
      addUtilities({
        ".text-glow-violet": {
          textShadow: "0 0 12px rgba(139,92,246,0.8), 0 0 24px rgba(139,92,246,0.4)",
        },
        ".text-glow-gold": {
          textShadow: "0 0 12px rgba(245,158,11,0.8), 0 0 24px rgba(245,158,11,0.4)",
        },
        ".scrollbar-hidden": {
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
        ".no-tap-highlight": {
          "-webkit-tap-highlight-color": "transparent",
        },
        ".safe-bottom": {
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        },
        ".safe-top": {
          paddingTop: "env(safe-area-inset-top, 0px)",
        },
      });
    },
  ],
};
