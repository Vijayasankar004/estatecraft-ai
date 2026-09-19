import React from 'react';
import { Sparkles, Clock, CheckCircle2, Award, ArrowRight, Play } from 'lucide-react';

export default function DemoScriptModal({ isOpen, onClose, onSelectChip, onSwitchTab, t = (k, f) => f || k }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('walkthroughTitle', '2-Minute Interactive Walkthrough')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                {t('walkthroughSubtitle', 'Step-by-step product walkthrough to explore key features')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Timeline Steps */}
        <div className="space-y-4 text-xs">
          
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-[11px]">1</span>
                0:00 - 0:30 | The Hook & Zero-Friction Input (Agent Portal)
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Agent Studio</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>What to say:</strong> <em>"Real estate agents spend 45+ minutes writing listing copy for each home across Zillow, Instagram, and brochures. EstateCraft AI automates this instantly."</em>
            </p>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 space-y-1">
              <div className="text-emerald-700 dark:text-emerald-300 font-semibold">👉 Action:</div>
              <div>Click <strong>"Fill Sample Data"</strong> in the top-right banner. Notice that all specs, high-res photos, and tags populate with zero typing!</div>
              <div>Point out the <strong>Vibe Auto-Classifier</strong> badges dynamically updating (e.g. #VictorianHeritage, #Sunlit).</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono text-[11px]">2</span>
                0:30 - 1:00 | 3-Column Tone Comparison Display
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Feature 1 & 2</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>What to say:</strong> <em>"Different platforms require completely different copywriting styles. Instead of one generic paragraph, we generate three distinct platform personalities side-by-side."</em>
            </p>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 space-y-1">
              <div className="text-amber-700 dark:text-amber-300 font-semibold">👉 Action:</div>
              <div>Click <strong>"Generate 3 Tone Descriptions"</strong>. Observe the spinner and the side-by-side columns:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li><strong>Luxury/Upscale:</strong> Architectural prestige, curated scale.</li>
                <li><strong>Cozy/Family:</strong> Natural daylight, neighborhood warmth.</li>
                <li><strong>Instagram/Social:</strong> Punchy bullets, emojis, hashtags, and DM hook.</li>
              </ul>
              <div>Click <strong>"Copy to Clipboard"</strong>, then click <strong>"Save to Public Inventory"</strong> (confetti fires!).</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono text-[11px]">3</span>
                1:00 - 1:45 | Conversational Search & Match Reasoning
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Buyer Matcher</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>What to say:</strong> <em>"On the buyer side, real estate search has been stuck in rigid 2005 dropdown filters. We make it conversational: describe your lifestyle and get matched with transparent AI reasoning."</em>
            </p>
            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 space-y-1">
              <div className="text-indigo-700 dark:text-indigo-300 font-semibold">👉 Action:</div>
              <div>Switch to <strong>"Buyer Matchmaker"</strong> tab. Click the first Quick Test Chip: <em>"Cozy Victorian with original hardwood and a garden for a family"</em>.</div>
              <div>Highlight the <strong>Ranked Match Result (96% Match)</strong>.</div>
              <div>Point directly to the <strong>Highlighting AI Match Reasoning Box</strong> showing <em>"Why this fits: This property matches your Victorian architectural request and features an expansive private garden..."</em>.</div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-mono text-[11px]">4</span>
                1:45 - 2:00 | The Closer & Technical Architecture
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Full-Stack</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>What to say:</strong> <em>"EstateCraft AI is a complete full-stack system with Express REST APIs, intelligent semantic scoring, live Gemini integration, and zero-setup resilience. Thank you!"</em>
            </p>
          </div>

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20"
          >
            {t('gotIt', 'Got It! Start Exploring')}
          </button>
        </div>

      </div>
    </div>
  );
}
