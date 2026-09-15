import { useState } from "react";
import { ArrowRight, Check, LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function LocationSetup({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<"idle" | "locating" | "found" | "manual">("idle");
  const [location, setLocation] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("India");
  const [coordinates, setCoordinates] = useState<{ latitude: string; longitude: string } | null>(null);
  const updateFarm = trpc.farm.update.useMutation();
  const searchLocation = trpc.location.search.useMutation();
  const refreshMarkets = trpc.market.refresh.useMutation();
  const reverseLocation = trpc.location.reverse.useMutation({ onSuccess: (result) => { setLocation(result.label); setDistrict(result.district); setState(result.state); setStatus("found"); }, onError: () => { setLocation("Location detected · enter your district if needed"); setStatus("manual"); toast.error("We found your coordinates, but could not read the place name. You can edit it below."); } });

  const useDeviceLocation = () => {
    if (!navigator.geolocation) { setStatus("manual"); toast.error("Device location is not available in this browser."); return; }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition((position) => {
      const nextCoordinates = { latitude: String(position.coords.latitude), longitude: String(position.coords.longitude) };
      setCoordinates(nextCoordinates);
      setLocation("Reading your real location…");
      reverseLocation.mutate({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    }, () => { setStatus("manual"); toast.error("Location permission was not granted. You can enter your area manually."); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
  };

  const saveLocation = async () => {
    try {
      let resolvedDistrict = district.trim();
      let resolvedState = state.trim() || "India";
      let resolvedCoordinates = coordinates;
      if (!resolvedCoordinates || !resolvedDistrict) {
        const place = await searchLocation.mutateAsync({ query: location.trim() || "India" });
        resolvedCoordinates = { latitude: place.latitude, longitude: place.longitude };
        resolvedDistrict = place.district || location.trim();
        resolvedState = place.state || resolvedState;
        setCoordinates(resolvedCoordinates); setDistrict(resolvedDistrict); setState(resolvedState);
      }
      await updateFarm.mutateAsync({ location: location.trim() || "India", district: resolvedDistrict || "Not set", state: resolvedState, latitude: resolvedCoordinates?.latitude ?? "20.5937", longitude: resolvedCoordinates?.longitude ?? "78.9629" });
      const market = await refreshMarkets.mutateAsync({ district: resolvedDistrict || "Meerut", state: resolvedState });
      toast.success(market.live ? "Location saved and live mandi prices fetched" : "Location saved; latest available mandi prices loaded");
      onComplete();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save your location"); }
  };
  const busy = status === "locating" || reverseLocation.isPending || searchLocation.isPending || updateFarm.isPending || refreshMarkets.isPending;

  return <main className="location-page"><div className="location-shell"><div className="auth-brand"><span className="auth-brand-mark"><MapPin size={22}/></span><span>Kisaan-Kareer</span></div><div className="location-icon"><LocateFixed size={28}/></div><div className="auth-kicker">ONE LAST STEP</div><h1>Let’s find your farm.</h1><p className="location-lead">Use your device location so we can identify your village, district and state, then show accurate weather and local mandi prices for your farm.</p><button className="location-detect" onClick={useDeviceLocation} disabled={busy}>{busy ? "Reading your real location…" : status === "found" ? <><Check size={17}/> {location}</> : <><LocateFixed size={17}/> Use device location</>}</button><div className="location-divider"><span>or enter your area</span></div><label className="location-label">VILLAGE, TOWN OR DISTRICT<input value={location} onChange={(event) => { setLocation(event.target.value); setStatus("manual"); }} placeholder="e.g. Meerut, Uttar Pradesh" /></label><button className="location-save" onClick={saveLocation} disabled={busy || (!location.trim() && !coordinates)}>{busy ? "Fetching local mandi prices…" : "Continue to my dashboard"}<ArrowRight size={17}/></button><div className="location-note"><ShieldCheck size={15}/><span>Your location is used to fetch the nearest available mandi prices and personalize weather. It is saved in your private farmer profile.</span></div></div></main>;
}
