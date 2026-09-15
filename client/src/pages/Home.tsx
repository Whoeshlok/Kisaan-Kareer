import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Bell, BrainCircuit, ChevronDown, ChevronRight, CloudSun, Droplets,
  Home as HomeIcon, Leaf, Menu, Mic, Paperclip, Search, Send, Settings,
  ShoppingBasket, Sprout, TrendingUp, Upload, Wind, MapPin, ShieldCheck,
  Sparkles, Sun, ThermometerSun, CircleHelp, Languages,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { VoiceInputButton, VOICE_LANGUAGES } from "@/components/VoiceInputButton";
import { applyApiTranslations, collectVisibleText, translateVisiblePage, HINDI_TEXT } from "@/hindiTranslations";

const heroImage = "/manus-storage/kisaan-field_e6490dd2.jpg";
const fallbackCoordinates = { latitude: 28.9845, longitude: 77.7064 };
const fallbackMarketRows = (district: string) => [
  { commodity: "Wheat", market: `${district} Mandi`, modalPrice: "2350", change: 2 },
  { commodity: "Rice", market: `${district} Mandi`, modalPrice: "3120", change: 1 },
  { commodity: "Mustard", market: `${district} Mandi`, modalPrice: "5460", change: 3 },
  { commodity: "Sugarcane", market: `${district} Mandi`, modalPrice: "340", change: 0 },
];
const cropEmoji: Record<string, string> = { Wheat: "🌾", Rice: "🌾", Mustard: "🌿", Sugarcane: "🌽", Potato: "🥔" };

const UI_LANGUAGES = VOICE_LANGUAGES.filter(({ code }) => code !== "hinglish");
const UI_COPY: Record<string, Record<string, string>> = {
  hi: {
    Home: "होम", "Disease Detection": "रोग पहचान", "Decision Engine": "निर्णय इंजन", "Chat with AI": "AI से चैट", Alerts: "अलर्ट", "Farm Profile": "खेत प्रोफ़ाइल", Settings: "सेटिंग्स", "Good Morning": "सुप्रभात", "Here's what's happening with your crops today.": "आज आपकी फसलों की स्थिति यहाँ है।", "Check Weather": "मौसम देखें", "Plan your farming activities": "खेती की गतिविधियों की योजना बनाएं", "Mandi Prices": "मंडी भाव", "Get latest crop prices": "फसल के ताज़ा भाव देखें", "Detect Disease": "रोग पहचानें", "Upload image & get solution": "फोटो अपलोड कर समाधान पाएं", "Get Suggestions": "सुझाव पाएं", "AI based farming advice": "AI आधारित खेती सलाह", "Ask anything about farming": "खेती के बारे में पूछें", "Current Weather": "वर्तमान मौसम", "Active Alerts": "सक्रिय अलर्ट", "AI Farming Assistant": "AI कृषि सहायक", "Ask by voice": "आवाज़ से पूछें", "Speak in": "भाषा", "Ask anything about farming...": "खेती के बारे में कुछ भी पूछें...", "Better Decisions. Healthier Crops.": "बेहतर निर्णय। स्वस्थ फसलें।", "Prosperous Farmers.": "समृद्ध किसान।", "Weather that turns into action": "मौसम से सही कार्रवाई", "Spot crop issues early": "फसल की समस्या जल्दी पहचानें", "Your farm, one clear decision": "आपके खेत के लिए एक स्पष्ट निर्णय", "Stay ahead of important changes": "ज़रूरी बदलावों से पहले तैयार रहें", "Your complete farm context": "आपके खेत की पूरी जानकारी", "How it works": "यह कैसे काम करता है", "Upload a clear leaf image": "पत्ती की साफ़ फोटो अपलोड करें", "AI checks visual symptoms": "AI लक्षणों की जांच करता है", "Diagnosis and image reference are saved": "निदान और फोटो सुरक्षित किए जाते हैं"
  },
};
function translate(language: string, text: string) { return UI_COPY[language]?.[text] ?? (language === "hi" ? HINDI_TEXT[text] ?? text : text); }

const navItems = [
  { label: "Home", icon: HomeIcon }, { label: "Disease Detection", icon: Leaf },
  { label: "Decision Engine", icon: BrainCircuit }, { label: "Chat with AI", icon: CircleHelp },
  { label: "Alerts", icon: Bell }, { label: "Farm Profile", icon: Sprout }, { label: "Go Organic", icon: Leaf },
];

const quickActions = [
  { title: "Check Weather", sub: "Plan your farming activities", target: "Weather", icon: CloudSun, tone: "blue" },
  { title: "Mandi Prices", sub: "Get latest crop prices", target: "Mandi Prices", icon: ShoppingBasket, tone: "green" },
  { title: "Detect Disease", sub: "Upload image & get solution", target: "Disease Detection", icon: Leaf, tone: "lime" },
  { title: "Get Suggestions", sub: "AI based farming advice", target: "Decision Engine", icon: BrainCircuit, tone: "violet" },
  { title: "Chat with AI", sub: "Ask anything about farming", target: "Chat with AI", icon: CircleHelp, tone: "teal" },
];

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="section-header"><h2>{title}</h2>{action && <button onClick={onAction ?? (() => toast.success(`${action.replace("→", "").trim()} updated`))}>{action} <ChevronRight size={15} /></button>}</div>;
}

function Workspace({ active, onNavigate, t, weather, market, farm, crop, soil, recommendation, alerts, recentScans, onLogout, farmProfileForm, updateFarmProfileField, saveFarmProfile, profileUpdateMutation, farms, crops, treatments, irrigations, soilSuggestion, onSelectFarm, onAddFarm, onAddCrop, onAddTreatment, onAddIrrigation }: { active: string; onNavigate: (label: string) => void; t: (text: string) => string; weather?: any; market?: any; farm?: any; crop?: any; soil?: any; recommendation?: any; alerts?: any[]; recentScans?: any[]; onLogout: () => Promise<void>; farmProfileForm: any; updateFarmProfileField: (field: string, value: string | number) => void; saveFarmProfile: () => void; profileUpdateMutation: any; farms: any[]; onSelectFarm: (farmId: number) => void; crops: any[]; treatments: any[]; irrigations: any[]; soilSuggestion?: any; onAddFarm: (input: any) => void; onAddCrop: (input: any) => void; onAddTreatment: (input: any) => void; onAddIrrigation: (input: any) => void }) {
  const diseaseMutation = trpc.disease.analyze.useMutation();
  const profileMutation = trpc.farm.update.useMutation();
  const trpcUtils = trpc.useUtils();
  const [editingProfile, setEditingProfile] = useState(false);
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [showAddIrrigation, setShowAddIrrigation] = useState(false);
  const [newFarm, setNewFarm] = useState({ farmerName: farm?.farmerName ?? "Farmer", location: "", district: "", state: "", latitude: "20.5937", longitude: "78.9629", farmSizeAcres: "1", language: "English", irrigationMethod: "Tube well", farmingPreference: "Conventional", soilType: "Not tested", soilReportAvailable: 0, irrigationFrequency: "As needed" });
  const [newCrop, setNewCrop] = useState({ name: "", variety: "", stage: "Planning", sowingDate: "", harvestDate: "", chemicalName: "" });
  const [newTreatment, setNewTreatment] = useState({ treatmentDate: "", chemicalName: "", quantity: "", notes: "" });
  const [newIrrigation, setNewIrrigation] = useState({ irrigationDate: "", method: "", duration: "", notes: "" });
  const [profileForm, setProfileForm] = useState({
    farmerName: farm?.farmerName ?? "Sneha Sharma",
    location: farm?.location ?? "Meerut, Uttar Pradesh",
    district: farm?.district ?? "Meerut",
    state: farm?.state ?? "Uttar Pradesh",
    farmSizeAcres: farm?.farmSizeAcres ?? "4.5",
    language: farm?.language ?? "English · Hindi",
    irrigationMethod: farm?.irrigationMethod ?? "Tube well",
    farmingPreference: farm?.farmingPreference ?? "Conventional",
  });
  useEffect(() => {
    if (!farm) return;
    setProfileForm({
      farmerName: farm.farmerName,
      location: farm.location,
      district: farm.district,
      state: farm.state,
      farmSizeAcres: farm.farmSizeAcres,
      language: farm.language,
      irrigationMethod: farm.irrigationMethod,
      farmingPreference: farm.farmingPreference,
    });
  }, [farm]);
  const updateProfileField = (field: keyof typeof profileForm, value: string) => setProfileForm((current) => ({ ...current, [field]: value }));
  const saveProfile = async () => {
    try {
      await profileMutation.mutateAsync(profileForm);
      await Promise.all([
        trpcUtils.farm.profile.invalidate(),
        trpcUtils.farm.primaryCrop.invalidate(),
        trpcUtils.weather.current.invalidate(),
        trpcUtils.market.list.invalidate(),
      ]);
      setEditingProfile(false);
      toast.success("Farm profile saved to your database");
    } catch {
      toast.error("Could not save the farm profile. Please try again.");
    }
  };
  const handleDiseaseUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => diseaseMutation.mutate({ dataUrl: String(reader.result), mimeType: file.type }, {
      onSuccess: (result) => { trpcUtils.disease.recent.invalidate(); toast.success(`${result.source}: ${result.diagnosis.slice(0, 90)}…`); },
      onError: () => toast.error("Image analysis could not be completed. Please try again."),
    });
    reader.readAsDataURL(file);
  };
  const configs: Record<string, { eyebrow: string; title: string; description: string; icon: typeof CloudSun; tone: string }> = {
    Weather: { eyebrow: "LIVE FARM CONDITIONS", title: "Weather that turns into action", description: "Plan irrigation, spraying and harvesting around the next 5 days.", icon: CloudSun, tone: "blue" },
    "Mandi Prices": { eyebrow: "MARKET INTELLIGENCE", title: "Sell with better timing", description: "Compare today's mandi rates and follow the crops moving up.", icon: ShoppingBasket, tone: "green" },
    "Disease Detection": { eyebrow: "CROP HEALTH PILOT", title: "Spot crop issues early", description: "Upload a leaf photo and get an AI-guided next step for wheat, rice or mustard.", icon: Leaf, tone: "lime" },
    "Decision Engine": { eyebrow: "PERSONALIZED RECOMMENDATION", title: "Your farm, one clear decision", description: "Kisaan-Kareer combines crop stage, soil, weather and market context.", icon: BrainCircuit, tone: "violet" },
    Alerts: { eyebrow: "PROACTIVE FARM SIGNALS", title: "Stay ahead of important changes", description: "Weather, crop-health and price alerts in one calm, actionable feed.", icon: Bell, tone: "teal" },
    Settings: { eyebrow: "ACCOUNT SETTINGS", title: "Keep your workspace personal", description: "Manage language, profile preferences, location and access.", icon: Settings, tone: "green" },
    "Farm Profile": { eyebrow: "FARM PROFILE", title: "Your complete farm context", description: "Keep farm, soil and crop details ready for better recommendations.", icon: Sprout, tone: "green" },
    "Go Organic": { eyebrow: "ORGANIC FARMING PROGRAM", title: "Grow healthier. Earn sustainably.", description: "Discover practical organic steps, government support and a farmer-to-farmer learning community.", icon: Leaf, tone: "lime" },
  };
  const config = configs[active];
  if (!config) return null;
  const Icon = config.icon;
  const farmLocation = farm?.location ?? "Meerut, Uttar Pradesh";
  const cropName = crop?.name ?? "Wheat";
  const cropStage = crop?.stage ?? "Vegetative";
  const savedRecommendation = recommendation ?? { title: "Check soil moisture before irrigation", body: "Your saved recommendation will appear here after the farm profile is loaded.", confidence: "DATABASE READY", factors: JSON.stringify(["Farm profile", "Crop stage", "Weather"]) };
  const factorList = (() => { try { return JSON.parse(savedRecommendation.factors); } catch { return ["Farm profile", "Crop stage", "Weather"]; } })();

  return <div className="workspace-view">
    <div className="workspace-hero"><div><div className="eyebrow">{t(config.eyebrow)}</div><h1>{t(config.title)}</h1><p>{t(config.description)}</p></div><div className={`workspace-icon ${config.tone}`}><Icon size={30}/></div></div>

    {active === "Go Organic" && <OrganicWorkspace t={t} farm={farm} />}

    {active === "Weather" && <div className="workspace-grid">
      <div className="panel weather-detail"><SectionHeader title={farmLocation} action="Refresh"/><div className="detail-weather"><div className="detail-temp"><Sun size={54}/><strong>{Math.round(weather?.current?.temperature ?? 28)}°C</strong><span>{weather?.current?.label ?? "Partly cloudy"} · {weather?.source ?? "Loading farm weather"}</span></div><div className="metric-cards"><div><Droplets size={18}/>Humidity <b>{weather?.current?.humidity ?? 72}%</b></div><div><CloudSun size={18}/>Rain chance <b>{weather?.current?.rainProbability ?? 20}%</b></div><div><Wind size={18}/>Wind <b>{weather?.current?.windSpeed ?? 12} km/h</b></div><div><ThermometerSun size={18}/>Rain now <b>{weather?.current?.rainfall ?? 0} mm</b></div></div></div></div>
      <div className="panel action-panel"><SectionHeader title="Today's recommendation"/><div className="recommendation"><ShieldCheck size={22}/><div><b>{(weather?.current?.rainProbability ?? 20) > 50 ? `Delay irrigation for ${cropName}` : `Water ${cropName} before 8 AM`}</b><p>Recommendation updates from the weather snapshot and the crop stored in your farm profile.</p></div></div><div className="mini-timeline"><span>Now</span><b>{Math.round(weather?.current?.temperature ?? 28)}°</b><span>Forecast</span><b>{Math.round(weather?.daily?.[1]?.max ?? 31)}°</b><span>Rain chance</span><b>{weather?.current?.rainProbability ?? 20}%</b></div></div>
      <div className="panel wide-panel"><SectionHeader title="5-day outlook" action="Calendar view"/><div className="outlook-row">{(weather?.daily ?? []).map((day: any, index: number)=><div className="outlook-day" key={day.date}><span>{day.probability > 50 ? "🌦️" : "☀️"}</span><b>{index === 0 ? "Today" : new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" })}</b><strong>{Math.round(day.max)}° / {Math.round(day.min)}°</strong><small>{day.probability > 50 ? "Rain likely" : "Good for field work"}</small></div>)}</div></div>
    </div>}

    {active === "Mandi Prices" && <div className="workspace-grid">
      <div className="panel wide-panel"><SectionHeader title={`${farm?.district ?? "Your district"} mandi · ${market?.live ? "Live today" : "Database snapshot"}`} action="Compare markets"/><div className="market-summary"><div><span>Best moving crop</span><b>Mustard <em>↗ +3%</em></b></div><div><span>Average basket value</span><b>₹ 2,766 <small>per quintal</small></b></div><div><span>Data source</span><b>{market?.live ? "Agmarknet" : "Project DB"}</b></div></div><div className="market-table"><div className="table-head"><span>Crop</span><span>Today's price</span><span>Market</span><span>Trend</span></div>{(market?.items ?? fallbackMarketRows(farm?.district ?? "Your district")).map((r: any)=><div className="market-row" key={r.commodity}><span className="crop"><i>{cropEmoji[r.commodity] ?? "🌱"}</i>{r.commodity}</span><b>₹ {Number(r.modalPrice).toLocaleString("en-IN")}</b><span>{r.market ?? `${farm?.district ?? "Your district"} Mandi`}</span><em className={Number(r.change)===0?"flat":"up"}>↗ {r.change}%</em></div>)}</div><div className="data-source-note">{market?.source ?? "Market records are loading from the project database…"}</div></div>
      <div className="panel action-panel"><SectionHeader title="Sell smarter"/><div className="recommendation market"><TrendingUp size={22}/><div><b>Mustard is trending up</b><p>Consider selling in the next 2–3 days if you have storage available.</p><button className="text-action" onClick={()=>toast.success("Sell recommendation saved to your plan")}>Save recommendation →</button></div></div></div>
      <div className="panel wide-panel"><SectionHeader title="Price movement" action="Last 30 days"/><div className="fake-chart"><span>₹5,460</span><svg viewBox="0 0 700 100" preserveAspectRatio="none"><path d="M0 80 C80 78 110 55 170 68 S260 34 320 52 S410 78 470 41 S560 58 620 20 S670 35 700 10" fill="none" stroke="#2f9964" strokeWidth="4"/><path d="M0 80 C80 78 110 55 170 68 S260 34 320 52 S410 78 470 41 S560 58 620 20 S670 35 700 10 V100 H0Z" fill="#e6f4e9"/></svg><div><small>1 Aug</small><small>15 Aug</small><small>30 Aug</small></div></div></div>
    </div>}

    {active === "Disease Detection" && <div className="workspace-grid">
      <div className="panel wide-panel disease-how-it-works"><SectionHeader title={t("How it works")}/><div className="steps"><div><b>01</b><span>{t("Upload a clear leaf image")}</span></div><div><b>02</b><span>{t("AI checks visual symptoms")}</span></div><div><b>03</b><span>{t("Diagnosis and image reference are saved")}</span></div></div></div>
      <div className="panel upload-panel"><div className="dropzone"><div className="drop-icon"><Upload size={26}/></div><h3>Upload a crop or leaf photo</h3><p>Clear, well-lit images help us give a better diagnosis.</p><input id="crop-image-upload" type="file" accept="image/png,image/jpeg" hidden onChange={(event) => handleDiseaseUpload(event.target.files?.[0])}/><label className="upload-btn" htmlFor="crop-image-upload"><Upload size={15}/> {diseaseMutation.isPending ? "Analyzing…" : "Choose image"}</label><span>PNG, JPG up to 10 MB · Scan history is stored in your project database</span></div></div>
      <div className="panel action-panel"><SectionHeader title="Focused pilot crops"/><div className="pilot-list"><div><Leaf size={18}/><b>Wheat</b><span>Yellow rust · fungal spots</span></div><div><Sprout size={18}/><b>Rice</b><span>Blast · brown spot</span></div><div><ShoppingBasket size={18}/><b>Mustard</b><span>Aphids · leaf curl</span></div></div>{recentScans?.[0] && <div className="data-source-note">Last saved scan: {recentScans[0].diagnosis.slice(0, 120)}…</div>}</div>
      {diseaseMutation.data && <div className="panel wide-panel diagnosis-response"><div className="diagnosis-response-header"><div><div className="eyebrow">AI SCAN RESULT</div><h2>Diagnosis and next steps</h2></div><span className="diagnosis-source">{diseaseMutation.data.source}</span></div><div className="diagnosis-response-body"><div className="diagnosis-status"><ShieldCheck size={21}/><span>Review this guidance with a local agronomist before treating the crop.</span></div><p>{diseaseMutation.data.diagnosis}</p></div></div>}
    </div>}

    {active === "Decision Engine" && <div className="workspace-grid">
      <div className="panel wide-panel decision-panel"><SectionHeader title="Today's farm decision" action="Refresh analysis"/><div className="decision-card"><div className="decision-badge"><Sparkles size={18}/> {savedRecommendation.confidence}</div><h2>{savedRecommendation.title}</h2><p>{savedRecommendation.body}</p><div className="decision-factors">{factorList.map((factor: string) => <span key={factor}><ShieldCheck size={15}/> {factor}</span>)}</div><button className="upload-btn" onClick={()=>toast.success("Decision feedback saved")}>Mark as helpful</button></div></div>
      <div className="panel action-panel"><SectionHeader title="Context used"/><div className="context-list"><span><ShieldCheck size={16}/> Farm profile <b>{farm?.id ? "Complete" : "Loading"}</b></span><span><Leaf size={16}/> Soil test <b>{soil ? `Updated ${new Date(soil.testedAt).toLocaleDateString("en-IN")}` : "Not added"}</b></span><span><CloudSun size={16}/> Weather <b>{weather?.source?.includes("live") ? "Live" : "Database"}</b></span><span><TrendingUp size={16}/> Market <b>{market?.live ? "Live" : "Database"}</b></span></div></div>
      <div className="panel wide-panel"><SectionHeader title="Next 7 days"/><div className="decision-calendar">{["Today","Thu","Fri","Sat","Sun","Mon","Tue"].map((day,i)=><div key={day} className={i===0?"today":""}><b>{day}</b><span>{["Water check","Rain watch","Leaf scan","Nutrient check","Mandi review","Irrigation","Harvest plan"][i]}</span></div>)}</div></div>
    </div>}

    {active === "Alerts" && <div className="workspace-grid"><div className="panel wide-panel"><SectionHeader title="All active alerts" action="Mark all read"/><div>{(alerts ?? []).map((alert: any) => <div className="full-alert" key={alert.id}><i className={alert.severity === "medium" ? "yellow" : "red"}/><div><b>{alert.title}</b><p>{alert.message}</p></div><small>{new Date(alert.createdAt).toLocaleDateString("en-IN")}</small><button onClick={()=>toast.success("Alert marked as read")}>Dismiss</button></div>)}</div></div><div className="panel action-panel"><SectionHeader title="Alert preferences"/><div className="toggle-row"><span>Weather risk alerts</span><b>ON</b></div><div className="toggle-row"><span>Market movement alerts</span><b>ON</b></div><div className="toggle-row"><span>Crop health alerts</span><b>ON</b></div></div></div>}

    {active === "Farm Profile" && <div className="workspace-grid farm-profile-workspace"><div className="panel wide-panel"><div className="farm-profile-heading"><div><div className="eyebrow">FARM DETAILS</div><h2>Farm Profile</h2><p>These details power location-aware weather, crop advice, disease guidance and irrigation suggestions.</p></div><button className="upload-btn" onClick={saveFarmProfile} disabled={profileUpdateMutation.isPending}>{profileUpdateMutation.isPending ? "Saving…" : "Save profile"}</button></div><div className="farm-profile-collection"><div className="collection-header"><div><h3>Your farms</h3><p>Manage multiple fields or locations under this farmer account.</p></div><button className="plus-button" onClick={() => setShowAddFarm((value) => !value)}>＋ Add farm</button></div><div className="collection-cards">{farms.map((item: any, index: number) => <div className={`collection-card ${item.id === farm?.id ? "selected" : ""}`} key={item.id ?? index} onClick={() => onSelectFarm(item.id)} role="button" tabIndex={0}><Sprout size={17}/><div><b>{item.location || `Farm ${index + 1}`}</b><span>{item.farmSizeAcres} acres · {item.district || "District not set"}</span></div>{item.id === farm?.id && <em>Active</em>}</div>)}</div>{showAddFarm && <div className="mini-form"><input placeholder="Farm location" value={newFarm.location} onChange={(event) => setNewFarm({ ...newFarm, location: event.target.value })}/><input placeholder="District" value={newFarm.district} onChange={(event) => setNewFarm({ ...newFarm, district: event.target.value })}/><input placeholder="State" value={newFarm.state} onChange={(event) => setNewFarm({ ...newFarm, state: event.target.value })}/><input placeholder="Size in acres" value={newFarm.farmSizeAcres} onChange={(event) => setNewFarm({ ...newFarm, farmSizeAcres: event.target.value })}/><button className="upload-btn" onClick={() => { onAddFarm({ ...newFarm, farmerName: farm?.farmerName ?? "Farmer" }); setShowAddFarm(false); }}>Save new farm</button></div>}</div>
<div className="farm-profile-sections"><div><h3>Farm details</h3><div className="farm-profile-grid"><label>Location<input value={farmProfileForm.location} onChange={(event) => updateFarmProfileField("location", event.target.value)} placeholder="Village, district, state" /></label><label>Farm size (acres)<input inputMode="decimal" value={farmProfileForm.farmSizeAcres} onChange={(event) => updateFarmProfileField("farmSizeAcres", event.target.value)} /></label><label>Irrigation source<select value={farmProfileForm.irrigationMethod} onChange={(event) => updateFarmProfileField("irrigationMethod", event.target.value)}><option>Tube well</option><option>Canal</option><option>Rainfed</option><option>Drip irrigation</option></select></label><label>Irrigation frequency<select value={farmProfileForm.irrigationFrequency} onChange={(event) => updateFarmProfileField("irrigationFrequency", event.target.value)}><option>Every 3 days</option><option>Every 7 days</option><option>Every 10 days</option><option>As needed</option></select></label><label>Soil type<input value={farmProfileForm.soilType} onChange={(event) => updateFarmProfileField("soilType", event.target.value)} placeholder="Loam, clay, sandy..." /></label><label className="checkbox-field"><span>Soil report available?</span><input type="checkbox" checked={farmProfileForm.soilReportAvailable === 1} onChange={(event) => updateFarmProfileField("soilReportAvailable", event.target.checked ? 1 : 0)} /></label></div></div><div><h3>Crop details</h3><div className="farm-profile-grid"><label>Crop name<input value={farmProfileForm.cropName} onChange={(event) => updateFarmProfileField("cropName", event.target.value)} /></label><label>Variety<input value={farmProfileForm.cropVariety} onChange={(event) => updateFarmProfileField("cropVariety", event.target.value)} /></label><label>Chemical name<input value={farmProfileForm.chemicalName} onChange={(event) => updateFarmProfileField("chemicalName", event.target.value)} placeholder="e.g. Urea, Mancozeb" /></label><label>Sowing date<input type="date" value={farmProfileForm.sowingDate} onChange={(event) => updateFarmProfileField("sowingDate", event.target.value)} /></label><label>Harvesting date<input type="date" value={farmProfileForm.harvestDate} onChange={(event) => updateFarmProfileField("harvestDate", event.target.value)} /></label></div></div></div><div className="profile-history"><div className="collection-header"><div><h3>More crops in this farm</h3><p>Add every crop you grow in this field.</p></div><button className="plus-button" onClick={() => setShowAddCrop((value) => !value)}>＋ Add crop</button></div><div className="history-list">{crops.map((item: any) => <div className="history-row" key={item.id}><Leaf size={15}/><b>{item.name}</b><span>{item.variety || "Variety not added"} · {item.chemicalName || "No chemical added"}</span></div>)}</div>{showAddCrop && <div className="mini-form"><input placeholder="Crop name" value={newCrop.name} onChange={(event) => setNewCrop({ ...newCrop, name: event.target.value })}/><input placeholder="Variety" value={newCrop.variety} onChange={(event) => setNewCrop({ ...newCrop, variety: event.target.value })}/><input placeholder="Chemical name" value={newCrop.chemicalName} onChange={(event) => setNewCrop({ ...newCrop, chemicalName: event.target.value })}/><button className="upload-btn" onClick={() => { onAddCrop({ farmId: farm?.id ?? 0, ...newCrop }); setShowAddCrop(false); }}>Save crop</button></div>}<div className="history-columns"><div><div className="collection-header"><h3>Treatment history</h3><button className="plus-button" onClick={() => setShowAddTreatment((value) => !value)}>＋ Add</button></div>{treatments.length ? treatments.map((item: any) => <div className="history-row" key={item.id}><ShieldCheck size={15}/><b>{item.treatmentDate}</b><span>{item.chemicalName} · {item.quantity || "Quantity not added"}</span></div>) : <p className="empty-history">No previous treatment dates yet.</p>}{showAddTreatment && <div className="mini-form"><input type="date" value={newTreatment.treatmentDate} onChange={(event) => setNewTreatment({ ...newTreatment, treatmentDate: event.target.value })}/><input placeholder="Chemical name" value={newTreatment.chemicalName} onChange={(event) => setNewTreatment({ ...newTreatment, chemicalName: event.target.value })}/><input placeholder="Quantity" value={newTreatment.quantity} onChange={(event) => setNewTreatment({ ...newTreatment, quantity: event.target.value })}/><button className="upload-btn" onClick={() => { onAddTreatment({ farmId: farm?.id ?? 0, cropId: crop?.id, ...newTreatment }); setShowAddTreatment(false); }}>Save treatment</button></div>}</div><div><div className="collection-header"><h3>Irrigation history</h3><button className="plus-button" onClick={() => setShowAddIrrigation((value) => !value)}>＋ Add</button></div>{irrigations.length ? irrigations.map((item: any) => <div className="history-row" key={item.id}><Droplets size={15}/><b>{item.irrigationDate}</b><span>{item.method || "Method not added"} · {item.duration || "Duration not added"}</span></div>) : <p className="empty-history">No previous irrigation dates yet.</p>}{showAddIrrigation && <div className="mini-form"><input type="date" value={newIrrigation.irrigationDate} onChange={(event) => setNewIrrigation({ ...newIrrigation, irrigationDate: event.target.value })}/><input placeholder="Method" value={newIrrigation.method} onChange={(event) => setNewIrrigation({ ...newIrrigation, method: event.target.value })}/><input placeholder="Duration" value={newIrrigation.duration} onChange={(event) => setNewIrrigation({ ...newIrrigation, duration: event.target.value })}/><button className="upload-btn" onClick={() => { onAddIrrigation({ farmId: farm?.id ?? 0, cropId: crop?.id, ...newIrrigation }); setShowAddIrrigation(false); }}>Save irrigation</button></div>}</div></div><div className="soil-suggestion"><div><h3>Soil type near your location</h3><p>{soilSuggestion?.type ?? "Checking soil data for this location…"} · {soilSuggestion?.source ?? "SoilGrids"}</p></div><div className="soil-suggestion-actions"><span><MapPin size={15}/> Based on farm coordinates</span><button className="plus-button" disabled={!soilSuggestion?.type} onClick={() => updateFarmProfileField("soilType", soilSuggestion.type)}>Use suggested type</button></div></div></div></div><div className="panel action-panel"><SectionHeader title="Why we ask"/><div className="context-list"><span><CloudSun size={16}/> Weather personalization <b>Location</b></span><span><Leaf size={16}/> Crop health guidance <b>Crop</b></span><span><Droplets size={16}/> Irrigation planning <b>Soil</b></span><span><ShieldCheck size={16}/> Better decisions <b>All fields</b></span></div></div></div>}

    {active === "Settings" && <div className="workspace-grid"><div className="panel wide-panel"><SectionHeader title="Farmer profile" action={editingProfile ? undefined : "Edit profile"} onAction={() => setEditingProfile(true)} />{editingProfile ? <div className="profile-editor"><div className="profile-editor-intro"><div className="large-avatar">{(profileForm.farmerName || "S").charAt(0).toUpperCase()}</div><div><h3>Edit your farm context</h3><p>These details power weather, mandi and decision recommendations.</p></div></div><div className="profile-form-grid"><label>Farmer name<input value={profileForm.farmerName} onChange={(event) => updateProfileField("farmerName", event.target.value)} /></label><label>Farm size (acres)<input inputMode="decimal" value={profileForm.farmSizeAcres} onChange={(event) => updateProfileField("farmSizeAcres", event.target.value)} /></label><label>Location<input value={profileForm.location} onChange={(event) => updateProfileField("location", event.target.value)} /></label><label>District<input value={profileForm.district} onChange={(event) => updateProfileField("district", event.target.value)} /></label><label>State<input value={profileForm.state} onChange={(event) => updateProfileField("state", event.target.value)} /></label><label>Preferred language<select value={profileForm.language} onChange={(event) => updateProfileField("language", event.target.value)}><option>English · Hindi</option><option>Hindi</option><option>English</option><option>Punjabi</option></select></label><label>Irrigation method<select value={profileForm.irrigationMethod} onChange={(event) => updateProfileField("irrigationMethod", event.target.value)}><option>Tube well</option><option>Canal</option><option>Rainfed</option><option>Drip irrigation</option></select></label><label>Farming preference<select value={profileForm.farmingPreference} onChange={(event) => updateProfileField("farmingPreference", event.target.value)}><option>Conventional</option><option>Organic</option><option>Natural farming</option><option>Integrated</option></select></label></div><div className="profile-form-actions"><button className="cancel-btn" onClick={() => setEditingProfile(false)}>Cancel</button><button className="upload-btn" onClick={saveProfile} disabled={profileMutation.isPending}>{profileMutation.isPending ? "Saving…" : "Save profile"}</button></div></div> : <><div className="profile-card"><div className="large-avatar">{(farm?.farmerName ?? "Sneha").charAt(0)}</div><div><h3>{farm?.farmerName ?? "Sneha Sharma"}</h3><p><MapPin size={14}/> {farmLocation} · {farm?.farmSizeAcres ?? "4.5"} acres</p><span>Preferred language: {farm?.language ?? "English · Hindi"}</span></div></div><div className="settings-fields"><div><label>Primary crop</label><b>{cropName}</b></div><div><label>Crop stage</label><b>{cropStage}</b></div><div><label>Farming preference</label><b>{farm?.farmingPreference ?? "Conventional"}</b></div><div><label>Irrigation method</label><b>{farm?.irrigationMethod ?? "Tube well"}</b></div></div></>}</div><div className="panel action-panel"><SectionHeader title="Language & voice"/><div className="language-choice"><Languages size={19}/><div><b>{farm?.language ?? "English · Hindi"}</b><span>Saved in the farm profile database</span></div><ChevronRight size={16}/></div><div className="language-choice"><Mic size={19}/><div><b>Voice input</b><span>Ready for your next question</span></div><b className="status-on">ON</b></div><button className="logout-button" onClick={onLogout}>Log out of Kisaan-Kareer</button></div></div>}
  </div>;
}

function Home() {
  const { logout } = useAuth();
  const [active, setActive] = useState("Home");
  const [chat, setChat] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("hi");
  const [uiLanguage, setUiLanguage] = useState(() => localStorage.getItem("kisaan-kareer-ui-language") ?? "en");
  const [chatMessages, setChatMessages] = useState<Array<{ from: "user" | "ai"; text: string }>>([]);
  const languageInitialized = useRef(false);
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>();
  const selectedFarmInput = useMemo(() => selectedFarmId ? { farmId: selectedFarmId } : undefined, [selectedFarmId]);
  const farmQuery = trpc.farm.profile.useQuery(selectedFarmInput);
  const cropQuery = trpc.farm.primaryCrop.useQuery(selectedFarmInput);
  const soilQuery = trpc.farm.soil.useQuery(selectedFarmInput);
  const recommendationQuery = trpc.decision.current.useQuery();
  const alertsQuery = trpc.alerts.list.useQuery();
  const chatQuery = trpc.chat.history.useQuery();
  const recentScansQuery = trpc.disease.recent.useQuery();
  const farm = farmQuery.data;
  const crop = cropQuery.data;
  const coordinates = useMemo(() => ({ latitude: Number(farm?.latitude ?? fallbackCoordinates.latitude), longitude: Number(farm?.longitude ?? fallbackCoordinates.longitude) }), [farm?.latitude, farm?.longitude]);
  const marketInput = useMemo(() => ({ district: farm?.district ?? "Meerut", state: farm?.state ?? "Uttar Pradesh" }), [farm?.district, farm?.state]);
  const weatherQuery = trpc.weather.current.useQuery(coordinates, { enabled: Boolean(farm), staleTime: 300_000, refetchInterval: 300_000 });
  const marketQuery = trpc.market.list.useQuery(marketInput, { enabled: Boolean(farm), staleTime: 300_000, refetchInterval: 300_000 });
  const assistantMutation = trpc.assistant.ask.useMutation();
  const translationMutation = trpc.translation.translate.useMutation();
  const farmsQuery = trpc.farm.list.useQuery();
  const farmIdInput = useMemo(() => ({ farmId: farm?.id ?? 0 }), [farm?.id]);
  const cropsQuery = trpc.farm.crops.useQuery(farmIdInput, { enabled: Boolean(farm?.id) });
  const treatmentsQuery = trpc.farm.treatments.useQuery(farmIdInput, { enabled: Boolean(farm?.id) });
  const irrigationsQuery = trpc.farm.irrigations.useQuery(farmIdInput, { enabled: Boolean(farm?.id) });
  const soilSuggestionQuery = trpc.soil.suggest.useQuery(coordinates, { enabled: Boolean(farm), staleTime: 86_400_000 });
  const profileUpdateMutation = trpc.farm.update.useMutation({ onSuccess: async () => { await Promise.all([farmQuery.refetch(), cropQuery.refetch(), cropsQuery.refetch()]); toast.success("Farm profile saved"); } });
  const geocodeMutation = trpc.location.search.useMutation();
  const createFarmMutation = trpc.farm.create.useMutation({ onSuccess: async (created) => { await farmsQuery.refetch(); if (created?.id) setSelectedFarmId(created.id); toast.success("New farm added"); } });
  const createCropMutation = trpc.farm.addCrop.useMutation({ onSuccess: async () => { await Promise.all([cropsQuery.refetch(), cropQuery.refetch()]); toast.success("New crop added"); } });
  const addTreatmentMutation = trpc.farm.addTreatment.useMutation({ onSuccess: async () => { await treatmentsQuery.refetch(); toast.success("Treatment date saved"); } });
  const addIrrigationMutation = trpc.farm.addIrrigation.useMutation({ onSuccess: async () => { await irrigationsQuery.refetch(); toast.success("Irrigation date saved"); } });
  const [farmProfileForm, setFarmProfileForm] = useState({ location: "", farmSizeAcres: "", irrigationMethod: "", irrigationFrequency: "", soilType: "", soilReportAvailable: 0, chemicalName: "", cropName: "", cropVariety: "", sowingDate: "", harvestDate: "", treatmentDate: "", treatmentQuantity: "" });
  useEffect(() => {
    if (!farm) return;
    setFarmProfileForm({ location: farm.location ?? "", farmSizeAcres: farm.farmSizeAcres ?? "", irrigationMethod: farm.irrigationMethod ?? "", irrigationFrequency: (farm as any).irrigationFrequency ?? "", soilType: (farm as any).soilType ?? "", soilReportAvailable: Number((farm as any).soilReportAvailable ?? 0), cropName: crop?.name ?? "", cropVariety: crop?.variety ?? "", sowingDate: crop?.sowingDate ?? "", harvestDate: (crop as any)?.harvestDate ?? "", treatmentDate: (crop as any)?.treatmentDate ?? "", treatmentQuantity: (crop as any)?.treatmentQuantity ?? "", chemicalName: (crop as any)?.chemicalName ?? "" });
  }, [farm, crop]);
  const updateFarmProfileField = (field: string, value: string | number) => setFarmProfileForm((current) => ({ ...current, [field]: value }));
  const saveFarmProfile = () => profileUpdateMutation.mutate({ ...farmProfileForm, farmId: farm?.id });
  const addFarm = async (input: any) => {
    try {
      const place = await geocodeMutation.mutateAsync({ query: [input.location, input.district, input.state].filter(Boolean).join(", ") });
      createFarmMutation.mutate({ ...input, latitude: place.latitude, longitude: place.longitude });
    } catch {
      createFarmMutation.mutate(input);
      toast.info("Farm saved; location coordinates will use the India fallback until updated from device location.");
    }
  };
  const addCrop = (input: any) => createCropMutation.mutate(input);
  const addTreatment = (input: any) => addTreatmentMutation.mutate(input);
  const addIrrigation = (input: any) => addIrrigationMutation.mutate(input);

  useEffect(() => {
    if (chatQuery.data?.length) setChatMessages(chatQuery.data.map((message: any) => ({ from: message.role === "assistant" ? "ai" : "user", text: message.content })));
  }, [chatQuery.data]);

  useEffect(() => {
    if (!languageInitialized.current) {
      languageInitialized.current = true;
      return;
    }
    setChatMessages([]);
  }, [uiLanguage]);

  const navigate = (label: string) => setActive(label);
  const sendMessage = async (message?: string) => {
    const value = (message ?? chat).trim();
    if (!value) return;
    setChat("");
    setChatMessages((messages) => [...messages, { from: "user", text: value }]);
    try {
      const result = await assistantMutation.mutateAsync({ question: value, language: uiLanguage, farmId: farm?.id || undefined, history: chatMessages.slice(-8).map((item) => ({ role: item.from === "ai" ? "assistant" as const : "user" as const, content: item.text })) });
      setChatMessages((messages) => [...messages, { from: "ai", text: result.answer }]);
    } catch {
      const localFallback: Record<string, string> = { hi: "मिट्टी की नमी पहले जाँचें और सुबह जल्दी सिंचाई करें।", ta: "முதலில் மண்ணின் ஈரப்பதத்தைச் சரிபார்த்து, அதிகாலையில் நீர்ப்பாசனம் செய்யுங்கள்.", te: "ముందుగా నేల తేమను పరిశీలించి, ఉదయం నీరు పెట్టండి.", mr: "आधी मातीतील ओलावा तपासा आणि सकाळी लवकर पाणी द्या.", bn: "প্রথমে মাটির আর্দ্রতা পরীক্ষা করুন এবং ভোরে সেচ দিন।", gu: "પહેલા જમીનની ભેજ તપાસો અને વહેલી સવારે સિંચાઈ કરો.", kn: "ಮೊದಲು ಮಣ್ಣಿನ ತೇವಾಂಶವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮುಂಜಾನೆ ನೀರುಣಿಸಿ.", ml: "ആദ്യം മണ്ണിലെ ഈർപ്പം പരിശോധിച്ച് അതിരാവിലെ നനയ്ക്കുക.", pa: "ਪਹਿਲਾਂ ਮਿੱਟੀ ਦੀ ਨਮੀ ਜਾਂਚੋ ਅਤੇ ਸਵੇਰੇ ਜਲਦੀ ਸਿੰਚਾਈ ਕਰੋ।", ur: "پہلے مٹی کی نمی چیک کریں اور صبح سویرے پانی دیں۔", hinglish: "Pehle mitti ki nami check karein aur subah jaldi paani dein." };
      setChatMessages((messages) => [...messages, { from: "ai", text: localFallback[uiLanguage] ?? "Check soil moisture first and water in the early morning. I’ll keep this recommendation practical while the AI service reconnects." }]);
    }
  };
  const displayName = farm?.farmerName ?? "Sneha";
  const alerts = alertsQuery.data ?? [];
  const t = (text: string) => translate(uiLanguage, text);
  useEffect(() => { localStorage.setItem("kisaan-kareer-ui-language", uiLanguage); setVoiceLanguage(uiLanguage === "en" ? "en" : uiLanguage); }, [uiLanguage]);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      translateVisiblePage(uiLanguage === "hi" ? "hi" : "en");
      if (uiLanguage === "en" || uiLanguage === "hi") return;
      const languageLabel = UI_LANGUAGES.find((option) => option.code === uiLanguage)?.label ?? uiLanguage;
      const cacheKey = `kisaan-kareer-translations-${uiLanguage}`;
      const texts = collectVisibleText();
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "{}") as Record<string, string>;
        const missing = texts.filter((text) => !cached[text]);
        if (missing.length) {
          const result = await translationMutation.mutateAsync({ language: languageLabel, texts: missing });
          missing.forEach((text, index) => { cached[text] = result.translations[index] ?? text; });
          localStorage.setItem(cacheKey, JSON.stringify(cached));
        }
        applyApiTranslations(texts, texts.map((text) => cached[text] ?? text));
      } catch { toast.error(`Could not load ${languageLabel} translations. English is still available.`); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [uiLanguage, active, chatMessages.length]);

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Sprout size={25} strokeWidth={2.4} /></div><div><div className="brand-name">Kisaan-Kareer</div><div className="brand-tag">{t("Better Decisions. Healthier Crops.")}<br/>{t("Prosperous Farmers.")}</div></div></div><nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => navigate(label)}><Icon size={19} /><span>{t(label)}</span>{label === "Go Organic" && <em className="new-nav-badge">NEW</em>}</button>)}</nav><button className="nav-item settings" onClick={() => navigate("Settings")}><Settings size={19} /><span>{t("Settings")}</span></button><div className="sidebar-note"><div className="note-copy">Empowering<br/>farmers with<br/><b>AI and real-time<br/>insights.</b></div><div className="field-doodle">⌁<span>♧</span>⌁</div></div></aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu"><Menu size={21}/></button><div className="searchbar"><Search size={18}/><input placeholder={t("Search for crops, diseases, or ask a question...")} /></div><div className="profile-actions"><select className="global-language-select" value={uiLanguage} onChange={(event) => setUiLanguage(event.target.value)} aria-label="Website language">{UI_LANGUAGES.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select><button className="icon-button" onClick={() => toast.info(alerts.length ? `${alerts.length} farm alerts in your database` : "You’re all caught up")}><Bell size={20}/><span className="notification-dot" /></button><button className="profile" onClick={() => navigate("Settings")} aria-label="Open profile settings"><div className="avatar">{displayName.charAt(0)}</div><div><b>{displayName.split(" ")[0]}</b><span>{t("Farmer")}</span></div><ChevronDown size={16}/></button></div></header>
      <div className={`content-grid ${active === "Chat with AI" ? "chat-layout" : (active !== "Home" ? "workspace-layout" : "")}`}>
        {active !== "Home" && active !== "Chat with AI" && <Workspace active={active} onNavigate={navigate} t={t} onLogout={logout} farmProfileForm={farmProfileForm} updateFarmProfileField={updateFarmProfileField} saveFarmProfile={saveFarmProfile} profileUpdateMutation={profileUpdateMutation} onSelectFarm={setSelectedFarmId} farms={farmsQuery.data ?? []} crops={cropsQuery.data ?? []} treatments={treatmentsQuery.data ?? []} irrigations={irrigationsQuery.data ?? []} soilSuggestion={soilSuggestionQuery.data} onAddFarm={addFarm} onAddCrop={addCrop} onAddTreatment={addTreatment} onAddIrrigation={addIrrigation} weather={weatherQuery.data} market={marketQuery.data} farm={farm} crop={crop} soil={soilQuery.data} recommendation={recommendationQuery.data} alerts={alerts} recentScans={recentScansQuery.data} />}
        {active === "Home" && <section className="dashboard-content"><div className="hero-card" style={{ backgroundImage: `linear-gradient(90deg, rgba(244,250,236,.98) 0%, rgba(244,250,236,.88) 47%, rgba(244,250,236,.18) 100%), url(${heroImage})` }}><div><div className="eyebrow">{t("YOUR FARM")} • {farm?.location ?? "YOUR LOCATION"}</div><h1>{t("Good Morning")}, {displayName}! <span>👩‍🌾</span></h1><p>{t("Here’s what’s happening with your crops today.")}</p></div><div className="quote">“Sahi jaankari,<br/><b>behtar fasal.</b>”</div></div><div className="quick-actions">{quickActions.map(({ title, sub, target, icon: Icon, tone }) => <button className="quick-card" key={title} onClick={() => navigate(target)}><div className={`quick-icon ${tone}`}><Icon size={25}/></div><strong>{t(title)}</strong><span>{t(sub)}</span></button>)}</div>
          <div className="two-col"><div className="panel weather-panel"><SectionHeader title={t("Current Weather")} /><div className="location"><MapPin size={15} fill="currentColor" /> {farm?.location ?? "Meerut, Uttar Pradesh"} · {weatherQuery.data?.source ?? "Loading…"}</div><div className="weather-main"><div className="weather-temp"><div className="sun-cloud"><Sun size={42}/><CloudSun size={32}/></div><div><strong>{Math.round(weatherQuery.data?.current?.temperature ?? 28)}°C</strong><span>{weatherQuery.data?.current?.label ?? "Partly Cloudy"}</span></div></div><div className="weather-metrics"><div><Droplets size={15}/>{t("Humidity")} <b>{weatherQuery.data?.current?.humidity ?? 72}%</b></div><div><CloudSun size={15}/>{t("Rainfall Prob.")} <b>{weatherQuery.data?.current?.rainProbability ?? 20}%</b></div><div><Wind size={15}/>{t("Wind Speed")} <b>{weatherQuery.data?.current?.windSpeed ?? 12} km/h</b></div></div></div><div className="forecast">{(weatherQuery.data?.daily ?? []).slice(0,4).map((day: any, index: number) => <div key={day.date}><b>{day.probability > 50 ? "🌦️" : "☀️"}</b><span>{index === 0 ? t("Today") : new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" })}</span><small>{Math.round(day.max)}° / {Math.round(day.min)}°</small></div>)}</div></div><div className="panel mandi-panel"><SectionHeader title={t("Mandi Prices")} action="View All →" onAction={() => navigate("Mandi Prices")} /><div className="table-head"><span>{t("Crop")}</span><span>{t("Price (₹/quintal)")}</span><span>{t("Market")}</span></div>{(marketQuery.data?.items ?? fallbackMarketRows(farm?.district ?? "Your district")).slice(0,4).map((r: any) => <div className="price-row" key={r.commodity}><span className="crop"><i>{cropEmoji[r.commodity] ?? "🌱"}</i>{r.commodity}</span><b>₹ {Number(r.modalPrice).toLocaleString("en-IN")}</b><span>{r.market ?? `${farm?.district ?? "Your district"} Mandi`}</span><em className={Number(r.change) === 0 ? "flat" : "up"}>↗ {r.change}%</em></div>)}</div></div>
          <div className="two-col bottom-row"><div className="panel alerts-panel"><SectionHeader title="Active Alerts" action="View All →" onAction={() => navigate("Alerts")} />{alerts.slice(0,3).map((alert: any) => <div className="alert-item" key={alert.id}><i className={alert.severity === "medium" ? "yellow" : "red"}/><div><b>{alert.title}</b><span>{alert.message}</span></div><small>{new Date(alert.createdAt).toLocaleDateString("en-IN")}</small></div>)}</div><div className="panel disease-panel"><SectionHeader title="Disease Detection" action="Try Now →" onAction={() => navigate("Disease Detection")} /><div className="disease-body"><div className="leaf-image"><Leaf size={44}/><span>{cropName(crop?.name)}</span></div><div><b>Upload a photo of your crop</b><p>Get instant diagnosis and treatment recommendations using AI.</p><button className="upload-btn" onClick={() => navigate("Disease Detection")}><Upload size={15}/> Upload Image</button></div></div></div></div></section>}
        {(active === "Home" || active === "Chat with AI") && <aside className="assistant-panel"><div className="assistant-heading"><div className="assistant-heading-copy"><div className="sparkle"><Sparkles size={21}/></div><div><h2>{t("AI Farming Assistant")}</h2><p>{t("Your 24/7 farming companion · chat saved to database")}</p></div></div><div className="assistant-voice-action"><span>{t("Ask by voice")}</span><VoiceInputButton language={voiceLanguage} onTranscript={(text) => sendMessage(text)} onError={(message) => toast.error(message)} disabled={assistantMutation.isPending} className="voice-ask-button" /></div></div><div className="chat-scroll">{chatMessages.map((message, index) => message.from === "user" ? <div className="chat-row user-row" key={index}><div className="user-bubble">{message.text}</div><div className="mini-user">{displayName.charAt(0)}</div></div> : <div className="chat-row ai-row" key={index}><div className="bot-mark"><Sprout size={16}/></div><div className="ai-bubble">{message.text}</div></div>)}</div><div className="chat-context"><Leaf size={13}/> {t("Based on your saved farm profile, crop and live signals")}</div><div className="composer"><textarea value={chat} onChange={e => setChat(e.target.value)} onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}} placeholder={t("Ask anything about farming...")}/><div className="voice-toolbar"><span><Languages size={14}/> Speak in</span><select value={voiceLanguage} onChange={e => { setVoiceLanguage(e.target.value); setUiLanguage(e.target.value); }} aria-label="Voice language">{VOICE_LANGUAGES.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></div><div className="composer-actions"><button type="button" onClick={() => toast.info("Attach a crop photo from Disease Detection for visual diagnosis")}><Paperclip size={18}/></button><button className="send-button" onClick={() => sendMessage()} disabled={assistantMutation.isPending}><Send size={17}/></button></div></div></aside>}
      </div>
    </main>
  </div>;
}

function cropName(name?: string) { return (name ?? "Wheat").toUpperCase() + " LEAF"; }

export default Home;

function OrganicWorkspace({ t, farm }: { t: (text: string) => string; farm?: any }) {
  const [interest, setInterest] = useState<"mentee" | "mentor" | null>(null);
  const [joined, setJoined] = useState(false);
  const schemes = [
    { title: "Paramparagat Krishi Vikas Yojana", tag: "Organic cluster support", copy: "Support for cluster-based organic farming, certification and farmer training.", action: "Explore scheme" },
    { title: "Mission Organic Value Chain", tag: "North East focused", copy: "Help with inputs, aggregation, processing and market linkages for organic produce.", action: "View eligibility" },
    { title: "National Mission on Natural Farming", tag: "Low-cost transition", copy: "Guidance and support for natural inputs, on-farm preparations and soil health.", action: "See guidance" },
  ];
  const steps = ["Learn the basics", "Prepare soil and inputs", "Start a pilot plot", "Document and certify", "Sell with a premium story"];
  return <div className="organic-page">
    <div className="organic-intro"><div><span className="organic-kicker">{t("A practical path to organic")}</span><h2>{t("Your farm can lead the change")}</h2><p>{t("Start with one crop, learn from an experienced farmer and move at a pace that protects your income.")}</p><div className="organic-actions"><button className="organic-primary" onClick={() => setInterest("mentee")}>I want to start organic</button><button className="organic-secondary" onClick={() => setInterest("mentor")}>I can mentor a farmer</button></div></div><div className="organic-stat"><Leaf size={30}/><strong>{farm?.district ?? "Your district"}</strong><span>Organic learning circle</span></div></div>
    <div className="organic-grid"><div className="panel organic-roadmap"><SectionHeader title="Your organic transition roadmap"/><div className="organic-steps">{steps.map((step, index) => <div key={step} className={index === 0 ? "current" : ""}><b>0{index + 1}</b><span>{step}</span></div>)}</div><div className="organic-progress"><span>Starter progress</span><b>1 of 5 steps</b><div><i style={{ width: "20%" }}/></div></div></div><div className="panel organic-mentor"><SectionHeader title="Mentor–mentee program"/><p>Learn directly from educated farmers who have already built an organic practice.</p><div className="mentor-card"><div className="mentor-avatar">RK</div><div><b>Ramesh Kumar</b><span>Certified organic farmer · 8 years</span><small>Wheat, vegetables · Uttar Pradesh</small></div><button onClick={() => setJoined(true)}>{joined ? "Request sent" : "Connect"}</button></div><div className="mentor-note"><ShieldCheck size={17}/> Weekly check-ins, field visits and practical input planning.</div></div></div>
    <div className="panel schemes-panel"><SectionHeader title="Government schemes and support" action="See all schemes"/><div className="scheme-cards">{schemes.map((scheme) => <div className="scheme-card" key={scheme.title}><span>{scheme.tag}</span><h3>{scheme.title}</h3><p>{scheme.copy}</p><button onClick={() => toast.success(`${scheme.title}: eligibility guide opened`)}>{scheme.action} <ChevronRight size={14}/></button></div>)}</div><p className="scheme-disclaimer">Eligibility, subsidy amount and application windows vary by state. Confirm current details with your district agriculture office or official government portal before applying.</p></div>
    {interest && <div className="organic-interest"><div><b>{interest === "mentee" ? "Great — let’s match you with a mentor." : "Thank you for supporting the community."}</b><span>{interest === "mentee" ? "We’ll use your crop and district to suggest a nearby organic farmer." : "Your experience can help another farmer make a confident first step."}</span></div><button onClick={() => { setInterest(null); toast.success("Interest saved in your organic program plan"); }}>Save my interest</button></div>}
  </div>;
}
