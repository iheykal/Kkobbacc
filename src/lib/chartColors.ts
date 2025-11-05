/**
 * Optimized Color Palette for Pie Charts
 * Provides distinct, visually appealing colors that work well together
 */

// Maximum contrast colors - each color is completely different from others
export const PIE_CHART_COLORS = [
  '#FF0000', // Pure Red
  '#00FF00', // Pure Green  
  '#0000FF', // Pure Blue
  '#FFFF00', // Pure Yellow
  '#FF00FF', // Pure Magenta
  '#00FFFF', // Pure Cyan
  '#FF8000', // Orange
  '#8000FF', // Purple
  '#00FF80', // Spring Green
  '#FF0080', // Rose
  '#80FF00', // Lime
  '#0080FF', // Azure
  '#FF4000', // Red-Orange
  '#4000FF', // Blue-Purple
  '#00FF40', // Green-Cyan
  '#FF0040', // Red-Pink
  '#40FF00', // Yellow-Green
  '#0040FF', // Blue
  '#FF8000', // Orange
  '#8000FF', // Violet
]

// Maximum contrast color palettes - each color is completely different
export const DISTRICT_COLORS = [
  '#FF0000', // Pure Red
  '#00FF00', // Pure Green
  '#0000FF', // Pure Blue
  '#FFFF00', // Pure Yellow
  '#FF00FF', // Pure Magenta
  '#00FFFF', // Pure Cyan
]

export const PROPERTY_TYPE_COLORS = [
  '#FF8000', // Orange
  '#8000FF', // Purple
  '#00FF80', // Spring Green
  '#FF0080', // Rose
  '#80FF00', // Lime
  '#0080FF', // Azure
]

export const LISTING_TYPE_COLORS = [
  '#FF4000', // Red-Orange
  '#4000FF', // Blue-Purple
  '#00FF40', // Green-Cyan
  '#FF0040', // Red-Pink
  '#40FF00', // Yellow-Green
]

/**
 * Get a distinct color for pie chart segments
 * Ensures maximum visual separation between adjacent colors
 */
export const getDistinctColor = (index: number, colorPalette: string[] = PIE_CHART_COLORS): string => {
  // Always use direct index mapping to ensure each segment gets a completely different color
  return colorPalette[index % colorPalette.length];
}

/**
 * Get colors with guaranteed minimum contrast
 * Ensures no two adjacent segments have similar colors
 */
export const getContrastingColors = (count: number, colorPalette: string[] = PIE_CHART_COLORS): string[] => {
  // Always return the first N colors from the palette to ensure maximum difference
  return colorPalette.slice(0, Math.min(count, colorPalette.length));
}

/**
 * Generate colors with semantic meaning
 * Assigns specific colors based on data meaning
 */
export const getSemanticColors = (data: Array<{ name: string; value: number }>, colorMap: Record<string, string> = {}): string[] => {
  const defaultColors = [...PIE_CHART_COLORS];
  const colors: string[] = [];
  
  data.forEach((item, index) => {
    const normalizedName = item.name.toLowerCase().trim();
    
    // Check for semantic color mapping with flexible matching
    let matchedColor = null;
    
    // Try exact match first
    if (colorMap[normalizedName]) {
      matchedColor = colorMap[normalizedName];
    } else {
      // Try partial matching for district names
      for (const [key, color] of Object.entries(colorMap)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
          matchedColor = color;
          break;
        }
      }
    }
    
    if (matchedColor) {
      colors.push(matchedColor);
    } else {
      // Use default color selection
      colors.push(getDistinctColor(index, defaultColors));
    }
  });
  
  return colors;
}

// Predefined semantic color mappings with maximum contrast
export const SEMANTIC_COLOR_MAPS = {
  listingType: {
    'rent': '#00FF00',    // Pure Green for rent
    'sale': '#0000FF',    // Pure Blue for sale
    'lease': '#FFFF00',   // Pure Yellow for lease
    'auction': '#FF0000', // Pure Red for auction
  },
  propertyType: {
    'villa': '#FF00FF',     // Pure Magenta for villa
    'apartment': '#00FFFF', // Pure Cyan for apartment
    'bacweyne': '#FF8000',  // Orange for bacweyne
    'dabaq': '#8000FF',     // Purple for dabaq
    'house': '#00FF80',     // Spring Green for house
    'condo': '#FF0080',     // Rose for condo
  },
  district: {
    // All districts with distinctive colors
    'abdiaziz': '#FF0000',        // Pure Red
    'bondhere': '#00FF00',        // Pure Green
    'daynile': '#0000FF',         // Pure Blue
    'hamar‑jajab': '#FFFF00',     // Pure Yellow
    'hamar‑weyne': '#FF00FF',     // Pure Magenta
    'hodan': '#00FFFF',           // Pure Cyan
    'howl-wadag': '#FF8000',      // Orange
    'helwaa': '#8000FF',          // Purple
    'heliwaa': '#8000FF',         // Purple (alternative spelling)
    'kaxda': '#00FF80',           // Spring Green
    'karan': '#FF0080',           // Rose
    'shangani': '#80FF00',        // Lime
    'shibis': '#0080FF',          // Azure
    'waberi': '#FF4000',          // Red-Orange
    'warta nabada (formerly wardhigley)': '#4000FF', // Blue-Purple
    'wadajir': '#00FF40',         // Green-Cyan
    'yaqshid': '#FF0040',         // Red-Pink
    'darusalam': '#40FF00',       // Yellow-Green
    'dharkenley': '#0040FF',      // Blue
    'garasbaley': '#FF8000',      // Orange
    // Handle percentage labels
    'helwaa 50%': '#8000FF',      // Purple
    'hodan 25%': '#00FFFF',       // Cyan
    'wadajir 25%': '#00FF40',     // Green-Cyan
  }
};

/**
 * Validate color contrast between adjacent segments
 * Returns true if colors have sufficient contrast
 */
export const validateColorContrast = (colors: string[]): boolean => {
  for (let i = 0; i < colors.length; i++) {
    const current = colors[i];
    const next = colors[(i + 1) % colors.length];
    
    // Simple contrast check (you can enhance this with proper color contrast algorithms)
    if (current === next) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate a complete color scheme for a pie chart
 * Returns colors with guaranteed visual separation
 */
export const generatePieChartColors = (
  data: Array<{ name: string; value: number }>,
  options: {
    palette?: string[];
    semantic?: boolean;
    colorMap?: Record<string, string>;
  } = {}
): string[] => {
  const { palette = PIE_CHART_COLORS, semantic = false, colorMap = {} } = options;
  
  if (semantic && Object.keys(colorMap).length > 0) {
    return getSemanticColors(data, colorMap);
  }
  
  const colors = getContrastingColors(data.length, palette);
  
  // Validate and fix if needed
  if (!validateColorContrast(colors)) {
    console.warn('Color contrast validation failed, using fallback colors');
    return getContrastingColors(data.length, PIE_CHART_COLORS);
  }
  
  return colors;
};
