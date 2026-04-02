import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const DEFAULT_COLORS = {
    light: {
        background: '#fafafa',
        foreground: '#0a0a0a',
        card: '#ffffff',
        cardForeground: '#0a0a0a',
        primary: '#0a0a0a',
        primaryForeground: '#fafafa',
        secondary: '#f4f4f5',
        secondaryForeground: '#0a0a0a',
        muted: '#f4f4f5',
        mutedForeground: '#71717a',
        accent: '#f97316',
        accentForeground: '#fafafa',
        border: '#e4e4e7',
    },
    dark: {
        background: '#0a0a0a',
        foreground: '#fafafa',
        card: '#0f0f0f',
        cardForeground: '#fafafa',
        primary: '#fafafa',
        primaryForeground: '#0a0a0a',
        secondary: '#27272a',
        secondaryForeground: '#fafafa',
        muted: '#27272a',
        mutedForeground: '#a1a1aa',
        accent: '#f97316',
        accentForeground: '#fafafa',
        border: '#27272a',
    }
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Convert hex to HSL
const hexToHSL = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
            default: h = 0;
        }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const stored = localStorage.getItem('theme-mode');
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const [colors, setColors] = useState(() => {
        const stored = localStorage.getItem('theme-colors');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return DEFAULT_COLORS;
            }
        }
        return DEFAULT_COLORS;
    });

    // Apply theme colors to CSS variables
    const applyColors = (currentMode, currentColors) => {
        const root = document.documentElement;
        const modeColors = currentColors[currentMode];

        root.style.setProperty('--background', hexToHSL(modeColors.background));
        root.style.setProperty('--foreground', hexToHSL(modeColors.foreground));
        root.style.setProperty('--card', hexToHSL(modeColors.card));
        root.style.setProperty('--card-foreground', hexToHSL(modeColors.cardForeground));
        root.style.setProperty('--primary', hexToHSL(modeColors.primary));
        root.style.setProperty('--primary-foreground', hexToHSL(modeColors.primaryForeground));
        root.style.setProperty('--secondary', hexToHSL(modeColors.secondary));
        root.style.setProperty('--secondary-foreground', hexToHSL(modeColors.secondaryForeground));
        root.style.setProperty('--muted', hexToHSL(modeColors.muted));
        root.style.setProperty('--muted-foreground', hexToHSL(modeColors.mutedForeground));
        root.style.setProperty('--accent', hexToHSL(modeColors.accent));
        root.style.setProperty('--accent-foreground', hexToHSL(modeColors.accentForeground));
        root.style.setProperty('--border', hexToHSL(modeColors.border));
        root.style.setProperty('--input', hexToHSL(modeColors.border));
        root.style.setProperty('--ring', hexToHSL(modeColors.primary));
        root.style.setProperty('--popover', hexToHSL(modeColors.card));
        root.style.setProperty('--popover-foreground', hexToHSL(modeColors.cardForeground));
    };

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mode);
        localStorage.setItem('theme-mode', mode);
        applyColors(mode, colors);
    }, [mode, colors]);

    const toggleMode = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    const updateColor = (colorKey, value) => {
        setColors(prev => {
            const newColors = {
                ...prev,
                [mode]: {
                    ...prev[mode],
                    [colorKey]: value
                }
            };
            localStorage.setItem('theme-colors', JSON.stringify(newColors));
            return newColors;
        });
    };

    const resetColors = () => {
        setColors(DEFAULT_COLORS);
        localStorage.setItem('theme-colors', JSON.stringify(DEFAULT_COLORS));
    };

    const value = {
        mode,
        setMode,
        toggleMode,
        isDark: mode === 'dark',
        colors: colors[mode],
        updateColor,
        resetColors,
        DEFAULT_COLORS
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
