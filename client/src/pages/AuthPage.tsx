import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail, Sprout, UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const utils = trpc.useUtils();
  const signin = trpc.auth.signin.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("Welcome back to Kisaan-Kareer"); }, onError: (error) => toast.error(error.message) });
  const signup = trpc.auth.signup.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); toast.success("Account created. Let’s set your farm location."); }, onError: (error) => toast.error(error.message) });
  const isPending = signin.isPending || signup.isPending;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "signup") signup.mutate({ name, email, password });
    else signin.mutate({ email, password });
  };

  return <main className="auth-page">
    <section className="auth-story">
      <div className="auth-brand"><span className="auth-brand-mark"><Sprout size={23} /></span><span className="auth-brand-copy"><strong>Kisaan-Kareer</strong><small>Farmer intelligence, made local.</small></span></div>
      <div className="auth-story-copy"><div className="auth-kicker">YOUR FARM. YOUR LANGUAGE. YOUR DECISIONS.</div><h1>Better decisions<br/><em>start with knowing</em><br/>your field.</h1><p>Weather, crop health and market signals brought together for farmers across India.</p></div>
      <div className="auth-story-footer"><span><Leaf size={15}/> Built for India’s farmers</span><span>Better information. Better harvests.</span></div>
    </section>
    <section className="auth-form-side">
      <div className="auth-topline"><span>Farmer workspace</span><span className="auth-secure"><LockKeyhole size={13}/> Secure access</span></div>
      <div className="auth-form-wrap">
        <div className="auth-heading"><div className="auth-kicker">WELCOME TO KISAAN-KAREER</div><h2>{mode === "signup" ? "Start your farm journey." : "Welcome back, farmer."}</h2><p>{mode === "signup" ? "Create your profile to get weather and crop insights for your farm." : "Sign in to continue to your personalized farm dashboard."}</p></div>
        <div className="auth-tabs"><button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div>
        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && <label>FARMER NAME<div className="auth-input"><UserRound size={17}/><input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></div></label>}
          <label>EMAIL ADDRESS<div className="auth-input"><Mail size={17}/><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="farmer@example.com" /></div></label>
          <label>PASSWORD<div className="auth-input"><LockKeyhole size={17}/><input required minLength={mode === "signup" ? 8 : 1} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"} /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
          {mode === "signup" && <p className="auth-disclaimer">By continuing, you agree to create a private farmer profile. Your location is requested only after sign in to personalize weather.</p>}
          <button className="auth-submit" disabled={isPending}>{isPending ? "Please wait…" : mode === "signup" ? "Create farmer account" : "Sign in to my farm"}<ArrowRight size={17}/></button>
        </form>
        <p className="auth-switch">{mode === "signup" ? "Already have an account?" : "New to Kisaan-Kareer?"} <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>{mode === "signup" ? "Sign in" : "Create account"}</button></p>
      </div>
    </section>
  </main>;
}
