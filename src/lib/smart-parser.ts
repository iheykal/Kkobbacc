
interface ParsedProperty {
    listingType?: 'sale' | 'rent';
    propertyType?: string;
    beds?: string;
    baths?: string;
    price?: string;
    district?: string;
    location?: string;
    description?: string;
    measurement?: string;
    features?: string[]; // Added to capture detected features like Kitchen, Balcony
}

// Helper function to generate standardized Somali description
const generateSmartDescription = (parsed: ParsedProperty): string => {
    // Property type in Somali
    const propertyTypeMap: Record<string, string> = {
        'apartment': 'apartment',
        'villa': 'guri',
        'bacweyne': 'bacweyne',
        'dabaq': 'dabaq'
    };

    const propertyTypeSomali = parsed.propertyType
        ? propertyTypeMap[parsed.propertyType.toLowerCase()] || parsed.propertyType
        : 'guri';

    // Build the description parts
    let description = `Welcome to Kobac Property, waxaan idin heynaa ${propertyTypeSomali}`;

    // Add composition details if we have beds/baths
    if (parsed.beds || parsed.baths) {
        description += ` wuxuuna ka koobanyahay`;

        if (parsed.beds) {
            description += ` ${parsed.beds} qol`;
        }

        if (parsed.baths) {
            if (parsed.beds) {
                description += ` iyo`;
            }
            description += ` ${parsed.baths} musqulood`;
        }

        // Add kitchen if detected
        if (parsed.features?.includes('Kitchen')) {
            description += ` iyo jiko`;
        }
    }

    // Add rental price for rent properties
    if (parsed.listingType === 'rent' && parsed.price) {
        description += `. Kirada bishii waa $${parsed.price}`;
    }

    // Add contact information
    description += `. Wixii faahfaahin dheeraad ah nagala soo xariir 0610251014.`;

    return description;
};

export const parseSmartText = (text: string): ParsedProperty => {
    const result: ParsedProperty = {
        features: []
    };

    // Helper to normalize text for easier parsing (keep emojis)
    const cleanText = text.replace(/\*/g, ' ').replace(/\s+/g, ' ');

    // 1. Detect Listing Type (Kiro vs Iib)
    if (/#?KIRADA|#?KIRO|#?RENT|#?K I R O/i.test(text)) {
        result.listingType = 'rent';
    } else if (/#?IIB|#?SALE|#?I I B/i.test(text)) {
        result.listingType = 'sale';
    }

    // 2. Detect Property Type
    if (/#?DABAQ|#?APARTMENT|#?FLAT/i.test(text)) {
        result.propertyType = 'apartment';
    } else if (/#?GURI|#?VILLA|#?HOUSE|#?VELA/i.test(text)) {
        result.propertyType = 'villa'; // Default to villa/house
    } else if (/#?BACWEYNE|#?BACWENE/i.test(text)) {
        result.propertyType = 'bacweyne';
    }

    // 3. Extract Beds (e.g., "2qol", "3 qol", "4hurdo", "2 Bedroom")
    // Look for number nearby typical room keywords
    const bedsMatch = text.match(/(\d+)\s*(?:x)?\s*(?:qol|bedroom|chamber|hurdo|bed|rooms?)/i);
    if (bedsMatch) {
        result.beds = bedsMatch[1];
    }

    // 4. Extract Baths (e.g., "1 Suli", "2suuli", "1🚽Suli", "2banyo", "1 musqu")
    // Improved regex: allow for emojis and variations of "toilet"
    const bathsMatch = text.match(/(\d+)\s*(?:x)?\s*(?:🚽|🛁|🚿)?\s*(?:Suuli|Suli|Musqu|Toilet|Baths?|Banyo|W\.?C)/i);
    if (bathsMatch) {
        result.baths = bathsMatch[1];
    }

    // 5. Extract Kitchen (Kushiin/Madbakh) - Add to features if found
    if (/(?:Kushiin|Kushin|Jiko|Madbakh|Kitchen|🍽️|🍳)/i.test(text)) {
        result.features?.push('Kitchen');
    }

    // 6. Extract Dining (Fadhi/Dining)
    if (/(?:Fadhi|Dining|Saloon|Sallon)/i.test(text)) {
        result.features?.push('Dining Room');
    }

    // 7. Extract Balcony (Balakoon)
    if (/(?:Balakoon|Balcony|Baranda)/i.test(text)) {
        result.features?.push('Balcony');
    }

    // 8. Extract Store (Bakaar)
    if (/(?:Bakaar|Store|Storage)/i.test(text)) {
        result.features?.push('Store');
    }

    // 9. Extract Price (e.g., "$250", "250$", "KIRADA : 250$")
    // Improved logic: prioritize explicit price labels, then fallback to currency formats
    const priceLabelMatch = text.match(/(?:#?KIRADA|#?PRICE|#?QIIMAHA|#?QIIMO)\s*[:\s-]*([$]?[\d,.]+\s*[$]?)/i);
    if (priceLabelMatch) {
        result.price = priceLabelMatch[1].replace(/[$,]/g, '').trim();
    } else {
        // Fallback: look for standalone patterns like $250 or 250$ or 250 USD
        const currencyMatch = text.match(/(?:\$)\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)|(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:\$|USD|Dollar)/i);
        if (currencyMatch) {
            result.price = (currencyMatch[1] || currencyMatch[2]).replace(/,/g, '');
        }
    }

    // 10. Extract District (e.g., "#DEGMADA_GURIGA :HAWL WADAAG")
    const districtMatch = text.match(/(?:#?DEGMADA(?:_GURIGA)?|#?DEGMADA)\s*[:\s-]*([^\n\r,]+)/i);
    if (districtMatch) {
        result.district = districtMatch[1].trim();
    }

    // 11. Extract Location (e.g., "#GOOBTA_GURIGA:MASJIDKA BIYAMALOW")
    const locationMatch = text.match(/(?:#?GOOBTA(?:_GURIGA)?|#?GOOBTA|#?LOCATION)\s*[:\s-]*([^\n\r,]+)/i);
    if (locationMatch) {
        result.location = locationMatch[1].trim();
    }

    // 12. Smart fallback: fuzzy match districts if not explicitly tagged
    // If district wasn't found by tag, scan text for known district names
    if (!result.district) {
        const districts = [
            'Abdiaziz', 'Bondhere', 'Daynile', 'Hamar-Jajab', 'Hamar-Weyne', 'Hodan',
            'Howl-Wadag', 'Heliwaa', 'Kaxda', 'Karan', 'Shangani', 'Shibis', 'Waberi',
            'Wardhiigleey', 'Wadajir', 'Yaqshid', 'Darusalam', 'Dharkenley', 'Garasbaley'
        ];

        // Create a regex that looks for these words with word boundaries
        // Normalize text for search (remove special chars)
        const normalizedText = text.toUpperCase().replace(/[^A-Z\s]/g, ' ');

        for (const d of districts) {
            // Handle special spellings
            let pattern = d.toUpperCase();
            if (d === 'Hamar-Jajab') pattern = 'HAMAR[\\s-]?JAJAB|XAMAR[\\s-]?JAJAB';
            else if (d === 'Hamar-Weyne') pattern = 'HAMAR[\\s-]?WEYNE|XAMAR[\\s-]?WEYNE';
            else if (d === 'Howl-Wadag') pattern = 'HAWL[\\s-]?WADAAG|HOWL[\\s-]?WADAAG';

            if (new RegExp(`\\b${pattern}\\b`).test(normalizedText)) {
                result.district = d;
                break; // Stop at first match
            }
        }
    }

    // 13. Auto-correct common district spelling variations (Standardization)
    if (result.district) {
        const raw = result.district.toUpperCase();
        if (raw.includes('WADAAG') || raw.includes('WADAG')) result.district = 'Howl-Wadag';
        else if (raw.includes('HODAN')) result.district = 'Hodan';
        else if (raw.includes('YAAQSHIID') || raw.includes('YAQSHID')) result.district = 'Yaqshid';
        else if (raw.includes('HELIWAA') || raw.includes('HURWAA') || raw.includes('HURIWAA')) result.district = 'Heliwaa';
        else if (raw.includes('DAYNILE') || raw.includes('DAYNIILE')) result.district = 'Daynile';
        else if (raw.includes('KAARAN') || raw.includes('KARAN')) result.district = 'Karan';
        else if (raw.includes('SHINGANI') || raw.includes('SHANGANI')) result.district = 'Shangani';
        else if ((raw.includes('XAMAR') || raw.includes('HAMAR')) && (raw.includes('WEYNE') || raw.includes('WEYN'))) result.district = 'Hamar‑Weyne';
        else if ((raw.includes('XAMAR') || raw.includes('HAMAR')) && (raw.includes('JAJAB') || raw.includes('JAJB'))) result.district = 'Hamar‑Jajab';
        else if (raw.includes('WABERI') || raw.includes('WAABERI')) result.district = 'Waberi';
        else if (raw.includes('WADAJIR')) result.district = 'Wadajir';
        else if (raw.includes('WARDHIGLEY') || raw.includes('WARDHIIGLEEY')) result.district = 'Wardhiigleey';
        else if (raw.includes('DHARKINLEY') || raw.includes('DHARKENLEY')) result.district = 'Dharkenley';
        else if (raw.includes('GARASBALEY')) result.district = 'Garasbaley';
        else if (raw.includes('DARUSALAM')) result.district = 'Darusalam';
        else if (raw.includes('SHIBIS')) result.district = 'Shibis';
        else if (raw.includes('BONDHERE') || raw.includes('BOONDHERE')) result.district = 'Bondhere';
        else if (raw.includes('ABDIAZIZ') || raw.includes('CABDI')) result.district = 'Abdiaziz';
        else if (raw.includes('KAXDA')) result.district = 'Kaxda';
    }

    // Generate smart description based on parsed data
    result.description = generateSmartDescription(result);

    return result;
}
