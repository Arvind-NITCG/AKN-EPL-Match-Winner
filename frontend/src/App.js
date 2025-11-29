import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Activity, Shield, PieChart, AlertCircle, ChevronDown, ArrowLeft } from 'lucide-react';

// --- CONSTANTS: YOUR SPECIFIC 20 TEAMS ---
const TEAMS = [
  'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton', 
  'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 
  'Leeds', 'Liverpool', 'Man City', 'Man United', 'Newcastle', 
  "Nott'm Forest", 'Sunderland', 'Tottenham', 'West Ham', 'Wolves'
].sort();

// --- COMPONENTS ---
const FallingFootballs = () => {
  const footballs = Array.from({ length: 25 });
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {footballs.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -50, x: Math.random() * window.innerWidth, opacity: 1, rotate: 0 }}
          animate={{ y: window.innerHeight + 50, rotate: 360 }}
          transition={{ duration: Math.random() * 2 + 3, repeat: Infinity, delay: Math.random() * 2 }}
          className="absolute text-5xl"
        >
          ⚽
        </motion.div>
      ))}
    </div>
  );
};

const DonutChart = ({ home, draw, away }) => {
  const r = 40; const c = 2 * Math.PI * r;
  const homeLen = (home / 100) * c;
  const drawLen = (draw / 100) * c;
  const awayLen = (away / 100) * c;
  
  return (
    <div className="relative w-56 h-56 mx-auto my-6">
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="rotate-[-90deg]">
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#0f172a" strokeWidth="12" />
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#22d3ee" strokeWidth="12" strokeDasharray={`${homeLen} ${c}`} strokeDashoffset={0} />
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#64748b" strokeWidth="12" strokeDasharray={`${drawLen} ${c}`} strokeDashoffset={-homeLen} />
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#ec4899" strokeWidth="12" strokeDasharray={`${awayLen} ${c}`} strokeDashoffset={-(homeLen + drawLen)} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-300">
        <span className="text-xs font-bold uppercase tracking-widest">Probability</span>
        <PieChart className="w-8 h-8 mt-2 text-slate-500" />
      </div>
    </div>
  );
};

const TeamLogo = ({ name, size = "large" }) => {
  const onError = (e) => { 
    e.target.style.display = 'none'; 
    const shield = e.target.parentElement.querySelector('svg');
    if(shield) shield.style.display = 'block';
  };
  
  const dim = size === "large" ? "w-24 h-24" : "w-16 h-16";
  
  return (
    <div className={`flex flex-col items-center gap-3`}>
      <div className={`${dim} relative bg-white/5 rounded-full p-3 border border-white/10 shadow-lg flex items-center justify-center`}>
        <img src={`/assets/${name}.png`} alt={name} className="w-full h-full object-contain" onError={onError} />
        <Shield className="w-10 h-10 text-slate-600 hidden absolute" />
      </div>
      <span className={`font-bold text-white tracking-wide text-center ${size === "large" ? "text-xl" : "text-lg"}`}>
        {name || "Select Team"}
      </span>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [view, setView] = useState('input'); 
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeRank, setHomeRank] = useState('');
  const [awayRank, setAwayRank] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam || !homeRank || !awayRank) {
      setError("Please complete all fields."); return;
    }
    if (homeTeam === awayTeam) {
      setError("Teams must be different."); return;
    }

    setView('loading');
    setError(null);

    try {
      const response = await axios.post('http://127.0.0.1:8000/predict', {
        home_team: homeTeam, away_team: awayTeam,
        home_rank: parseInt(homeRank), away_rank: parseInt(awayRank)
      });
      
      setTimeout(() => {
        setResult(response.data);
        setView('result');
      }, 1500);
    } catch (err) {
      setView('input');
      setError("Prediction Service Unavailable.");
    }
  };

  return (
    // UPDATED: 'fixed inset-0' pins it to the screen edges. No scrolling possible.
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white font-sans flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500 rounded-full blur-[128px]"></div>
      </div>

      {view === 'result' && result?.prediction !== 'D' && <FallingFootballs />}

      <div className="w-full max-w-2xl z-10 relative">
        <AnimatePresence mode='wait'>
          
          {/* --- PAGE 1: INPUT FORM --- */}
          {view === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-6xl font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">
                  Match Winner
                </h1>
                <p className="text-slate-400 text-xl font-medium">AI-Powered EPL Predictor</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-2xl">
                
                {/* Home Team Section */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between px-1">
                    <label className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Home Team</label>
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Rank</label>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative flex-1 group">
                      <select 
                        value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}
                        className="w-full h-16 bg-slate-900/60 border border-slate-600 rounded-2xl px-6 text-lg appearance-none focus:ring-2 focus:ring-cyan-400 outline-none transition-all cursor-pointer group-hover:bg-slate-900/80 text-white"
                      >
                        <option value="" disabled>Select Team</option>
                        {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-6 top-5 w-6 h-6 text-slate-500 pointer-events-none" />
                    </div>
                    <input 
                      type="number" placeholder="#" min="1" max="20"
                      value={homeRank} onChange={(e) => setHomeRank(e.target.value)}
                      className="w-24 h-16 bg-slate-900/60 border border-slate-600 rounded-2xl text-center text-xl font-bold focus:ring-2 focus:ring-cyan-400 outline-none text-white"
                    />
                  </div>
                </div>

                {/* VS Badge */}
                <div className="flex justify-center my-2">
                  <div className="bg-slate-800 border border-slate-600 rounded-full px-4 py-1 text-sm font-black text-slate-500 shadow-inner">
                    VS
                  </div>
                </div>

                {/* Away Team Section */}
                <div className="space-y-3 mb-10">
                  <div className="flex justify-between px-1">
                    <label className="text-sm font-bold text-pink-500 uppercase tracking-wider">Away Team</label>
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Rank</label>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative flex-1 group">
                      <select 
                        value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}
                        className="w-full h-16 bg-slate-900/60 border border-slate-600 rounded-2xl px-6 text-lg appearance-none focus:ring-2 focus:ring-pink-500 outline-none transition-all cursor-pointer group-hover:bg-slate-900/80 text-white"
                      >
                        <option value="" disabled>Select Team</option>
                        {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-6 top-5 w-6 h-6 text-slate-500 pointer-events-none" />
                    </div>
                    <input 
                      type="number" placeholder="#" min="1" max="20"
                      value={awayRank} onChange={(e) => setAwayRank(e.target.value)}
                      className="w-24 h-16 bg-slate-900/60 border border-slate-600 rounded-2xl text-center text-xl font-bold focus:ring-2 focus:ring-pink-500 outline-none text-white"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handlePredict}
                  className="w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-cyan-500/30 flex items-center justify-center gap-3"
                >
                  <Trophy className="w-6 h-6" /> Predict Winner
                </motion.button>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center justify-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-5 h-5" /> {error}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* --- PAGE 2: LOADING STATE --- */}
          {view === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh] text-center"
            >
              <Activity className="w-24 h-24 text-cyan-400 animate-bounce mb-8" />
              <h2 className="text-3xl font-bold text-white mb-2">Analyzing Match Data...</h2>
              <p className="text-slate-400">Consulting historical performance & live ranks</p>
            </motion.div>
          )}

          {/* --- PAGE 3: RESULT SCREEN --- */}
          {view === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="relative"
            >
              <div className="bg-slate-800/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
                
                {/* Winner Header */}
                <div className="text-center mb-10 relative z-10">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] block mb-4">Predicted Outcome</span>
                  <h1 className="text-6xl font-black text-white drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]">
                    {result.prediction === 'H' ? homeTeam.toUpperCase() : result.prediction === 'A' ? awayTeam.toUpperCase() : "DRAW"}
                  </h1>
                  {result.prediction !== 'D' && (
                    <div className="inline-block bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-bold px-4 py-1 rounded-full mt-4 text-sm tracking-widest">
                      PROBABLE WINNER
                    </div>
                  )}
                </div>

                {/* Team Faceoff */}
                <div className="flex justify-between items-center px-4 mb-8">
                  <TeamLogo name={homeTeam} size="large" />
                  <div className="text-3xl font-black text-slate-600 opacity-50">VS</div>
                  <TeamLogo name={awayTeam} size="large" />
                </div>

                {/* Donut Chart */}
                <DonutChart 
                  home={result.probabilities.Home}
                  draw={result.probabilities.Draw}
                  away={result.probabilities.Away}
                />

                {/* Stats Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm font-medium text-slate-400 mb-10">
                  <div>
                    <div className="text-cyan-400 text-xl font-bold">{result.probabilities.Home}%</div>
                    {homeTeam}
                  </div>
                  <div>
                    <div className="text-slate-300 text-xl font-bold">{result.probabilities.Draw}%</div>
                    Draw
                  </div>
                  <div>
                    <div className="text-pink-500 text-xl font-bold">{result.probabilities.Away}%</div>
                    {awayTeam}
                  </div>
                </div>

                {/* Back Button Only */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => setView('input')} 
                    className="w-full py-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-bold text-slate-300 flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back to Menu
                  </button>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}