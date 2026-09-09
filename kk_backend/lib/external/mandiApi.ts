import { MandiPrice } from "@/types";
import { createClient } from "@/lib/supabase/server";

// Pull latest cached Agmarknet/e-NAM price for a crop from Supabase.
// A separate scheduled job should sync raw Agmarknet data into
// the mandi_prices table.
export async function getMandiPrice(
  crop: string,
  location: string
): Promise<MandiPrice | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("mandi_prices")
    .select("*")
    .eq("crop", crop)
    .order("recorded_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    crop: data.crop,
    market: data.market,
    price_per_quintal: data.price_per_quintal,
    trend: data.trend,
    recorded_on: data.recorded_on,
  };
}
