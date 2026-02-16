export interface BankOffer {
    bankName: string;
    interestRate: string;
    processingFee: string;
    maxTenure: number;
    link: string;
    features: string[];
}

export interface Location {
    lat: number;
    lng: number;
    name: string;
}

export interface LocationOption {
    name: string;
    code?: string;
    lat?: number;
    lng?: number;
}

export interface TrendPoint {
    year: number;
    price: number;
}

export interface PropertyReport {
    title: string;
    location: string;
    currentValuation: number;
    futureValuation: number;
    roi: number;
    duration: number;
    riskFactors: string[];
    growthFactors: string[];
    investmentRating: string;
    marketSentiment: string;
    summary?: string;
    investmentGuidance: {
        recommendation: string;
        bestTimeToInvest: string;
        riskLevel: string;
        returnPotential: string;
    };
    advantages: string[];
    disadvantages: string[];
    facilities: {
        category: string;
        items: string[];
    }[];
    infrastructure: {
        connectivity: string;
        publicTransport: string[];
        nearbyAirports: string[];
        highways: string[];
    };
    demographics: {
        population: string;
        literacyRate: string;
        majorIndustries: string[];
    };
    futureDevelopments: string[];
}

export interface PredictionResult {
    currentPrice: number;
    futurePrice: number;
    currency: string;
    trendHistory: TrendPoint[];
    explanation: string;
    location: Location;
    premiumFactor: number;
    report: PropertyReport;
    currentRatePerSqFt?: number;
    futureRatePerSqFt?: number;
}

export enum OwnerType {
    MALE = 'Male',
    FEMALE = 'Female',
    JOINT = 'Joint'
}

export enum PropertyType {
    LAND = 'Residential Land',
    AGRICULTURAL = 'Agricultural Land',
    COMMERCIAL = 'Commercial Land',
    INDUSTRIAL = 'Industrial Land',
    APARTMENT = 'Apartment'
}

export interface DutyCalculation {
    stampDuty: number;
    registration: number;
    gst: number;
    total: number;
    breakdown: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}
