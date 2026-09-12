import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Assumed schema (adjust table/column names here if yours differ —
 * this is the single place that needs updating):
 *
 * profiles(id, name, location, lat, lon, language, crop, variety,
 *          crop_stage, farm_size, irrigation_method, organic_preference)
 * mandi_prices(id, crop, market, price, unit, change_pct, updated_at)
 * alerts(id, profile_id, title, detail, created_at, read)
 */

export async function getFarmerProfile(profileId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();
  if (error) return null;
  return data;
}

export async function saveFarmerProfile(profile) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getBestMandiPriceForCrop(crop) {
  if (!crop) return null;
  const { data, error } = await supabase
    .from("mandi_prices")
    .select("*")
    .ilike("crop", crop)
    .order("price", { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function getMandiPrices(crop) {
  let query = supabase.from("mandi_prices").select("*").order("price", { ascending: false });
  if (crop) query = query.ilike("crop", crop);
  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function getAlerts(profileId) {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function getUnreadAlertCount(profileId) {
  const { count, error } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("read", false);
  if (error) return 0;
  return count || 0;
}

export async function insertAlert(profileId, title, detail) {
  const { data, error } = await supabase
    .from("alerts")
    .insert({ profile_id: profileId, title, detail, read: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}
