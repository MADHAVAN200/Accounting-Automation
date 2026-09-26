import React, { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Database, CheckCircle2, Lock, Mail } from "lucide-react";

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("madhavan@ledgerai.com");
  const [password, setPassword] = useState("••••••••••••");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(email);
    }, 400);
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    onLogin(demoEmail);
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0c0d11] border border-[#22242b] rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#050507] border border-[#22242b] text-[#38bdf8] shadow-lg mb-4">
            <Sparkles className="w-7 h-7 text-[#38bdf8]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">LedgerAI</h1>
          <p className="text-xs text-[#71717a] font-medium mt-1">Autonomous Double-Entry Accounting Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="accountant@company.com"
                className="w-full bg-[#050507] border border-[#22242b] rounded-xl px-10 py-2.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-semibold text-[#71717a] uppercase tracking-wider">
                Password
              </label>
              <span className="text-xs text-[#38bdf8] hover:underline cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050507] border border-[#22242b] rounded-xl px-10 py-2.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] transition-all"
              />
            </div>
          </div>

          <button
            id="btn-signin"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 group cursor-pointer border border-blue-500/40"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to LedgerAI</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Fast Prototype Quick Sign In */}
        <div className="mt-6 pt-6 border-t border-[#1e2029]">
          <p className="text-[11px] text-[#71717a] text-center mb-3">Quick Demo Profiles (Instant Access):</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("madhavan@ledgerai.com")}
              className="px-3 py-2 rounded-lg bg-[#050507] hover:bg-[#14151c] text-left border border-[#22242b] transition-colors group cursor-pointer"
            >
              <div className="text-xs font-semibold text-white group-hover:text-[#38bdf8]">Madhavan Nadar</div>
              <div className="text-[10px] text-[#71717a]">VP of Finance</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("auditor@ledgerai.com")}
              className="px-3 py-2 rounded-lg bg-[#050507] hover:bg-[#14151c] text-left border border-[#22242b] transition-colors group cursor-pointer"
            >
              <div className="text-xs font-semibold text-white group-hover:text-[#38bdf8]">Senior Auditor</div>
              <div className="text-[10px] text-[#71717a]">Compliance Lead</div>
            </button>
          </div>
        </div>

        {/* Prototype Highlights */}
        <div className="mt-6 flex items-center justify-between text-[11px] text-[#71717a]">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-[#38bdf8]" />
            Embedded SQLite Core
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#34d399]" />
            Double-Entry Guaranteed
          </span>
        </div>
      </div>
    </div>
  );
};
