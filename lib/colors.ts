export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(rgb1: {r: number, g: number, b: number}, rgb2: {r: number, g: number, b: number}) {
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Blend a color with white (bg) based on opacity
function blend(rgb: {r: number, g: number, b: number}, opacity: number, bg = {r: 255, g: 255, b: 255}) {
  return {
    r: Math.round((1 - opacity) * bg.r + opacity * rgb.r),
    g: Math.round((1 - opacity) * bg.g + opacity * rgb.g),
    b: Math.round((1 - opacity) * bg.b + opacity * rgb.b)
  };
}

export function getAccentTokens(accentValue: string | null) {
  const ACCENTS: Record<string, string> = {
    pink: "#FFC3E3",
    blue: "#CDEEFB",
    indigo: "#5B3FD1",
    orange: "#FF7A2F",
  };
  
  const defaultColor = "#5B3FD1";
  const baseHex = ACCENTS[accentValue || "indigo"] || defaultColor;
  const baseRgb = hexToRgb(baseHex);
  
  // Tint is 12% opacity over white
  const tintRgb = blend(baseRgb, 0.12);
  const tint = rgbToHex(tintRgb.r, tintRgb.g, tintRgb.b);
  
  // Glow is 35% opacity (we'll just return the rgba string for this one)
  const glow = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0.35)`;
  
  // Light mode ink: darken base until contrast with light tint is >= 4.5
  let inkLightRgb = { ...baseRgb };
  let currentContrastLight = contrast(tintRgb, inkLightRgb);
  
  while (currentContrastLight < 4.5 && (inkLightRgb.r > 0 || inkLightRgb.g > 0 || inkLightRgb.b > 0)) {
    inkLightRgb.r = Math.max(0, Math.floor(inkLightRgb.r * 0.9));
    inkLightRgb.g = Math.max(0, Math.floor(inkLightRgb.g * 0.9));
    inkLightRgb.b = Math.max(0, Math.floor(inkLightRgb.b * 0.9));
    currentContrastLight = contrast(tintRgb, inkLightRgb);
  }
  const inkLight = rgbToHex(inkLightRgb.r, inkLightRgb.g, inkLightRgb.b);

  // Dark mode ink: lighten base until contrast with dark tint is >= 4.5
  // Assuming dark mode card surface is #1E293B (rgb: 30, 41, 59)
  const darkSurface = { r: 30, g: 41, b: 59 };
  const darkTintRgb = blend(baseRgb, 0.12, darkSurface);
  let inkDarkRgb = { ...baseRgb };
  let currentContrastDark = contrast(darkTintRgb, inkDarkRgb);

  while (currentContrastDark < 4.5 && (inkDarkRgb.r < 255 || inkDarkRgb.g < 255 || inkDarkRgb.b < 255)) {
    inkDarkRgb.r = Math.min(255, Math.floor(inkDarkRgb.r + (255 - inkDarkRgb.r) * 0.1 + 1));
    inkDarkRgb.g = Math.min(255, Math.floor(inkDarkRgb.g + (255 - inkDarkRgb.g) * 0.1 + 1));
    inkDarkRgb.b = Math.min(255, Math.floor(inkDarkRgb.b + (255 - inkDarkRgb.b) * 0.1 + 1));
    currentContrastDark = contrast(darkTintRgb, inkDarkRgb);
  }
  const inkDark = rgbToHex(inkDarkRgb.r, inkDarkRgb.g, inkDarkRgb.b);
  
  return {
    base: baseHex,
    rgb: `${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}`,
    glowLight: `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0.35)`,
    glowDark: `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0.45)`, // slightly stronger glow
    tintLight: `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0.12)`,
    tintDark: `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0.20)`,
    inkLight,
    inkDark
  };
}
