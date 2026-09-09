export type Language = "en" | "hi" | "pa";

export interface Farmer {
  id: string;
  name: string;
  location: string;
  preferred_language: Language;
  farming_preference: "organic" | "conventional";
  created_at: string;
}

export interface Farm {
  id: string;
  farmer_id: string;
  farm_size_acres: number;
  irrigation_method: string;
  crop: string;
  variety: string | null;
  sowing_date: string;
  crop_stage:
    | "sowing"
    | "germination"
    | "vegetative"
    | "flowering"
    | "maturity"
    | "harvest";
}

export interface SoilTest {
  id: string;
  farm_id: string;
  ph: number;
  nitrogen: "low" | "medium" | "high";
  phosphorus: "low" | "medium" | "high";
  potassium: "low" | "medium" | "high";
  organic_carbon: number | null;
  ec_salinity: number | null;
  tested_on: string;
}

export interface WeatherSnapshot {
  temperature_c: number;
  rainfall_probability: number;
  humidity: number;
  wind_kmph: number;
  summary: string;
}

export interface MandiPrice {
  crop: string;
  market: string;
  price_per_quintal: number;
  trend: "rising" | "falling" | "stable";
  recorded_on: string;
}

export interface ChatMessage {
  id: string;
  farmer_id: string;
  role: "farmer" | "ai";
  type: "text" | "image" | "voice";
  content: string;
  image_url?: string | null;
  created_at: string;
}

export interface DecisionEngineInput {
  farmer: Farmer;
  farm: Farm;
  soilTest: SoilTest | null;
  weather: WeatherSnapshot;
  mandiPrice: MandiPrice | null;
  question?: string;
}

export interface DecisionEngineOutput {
  recommendation: string;
  reasoning: string;
  nextSteps: string[];
  urgency: "low" | "medium" | "high";
}
