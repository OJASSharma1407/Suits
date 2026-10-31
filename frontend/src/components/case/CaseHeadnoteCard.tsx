import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  RefreshCw,
  Scale,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { headnoteService } from '@/services/headnote';
import type {
  CaseHeadnoteResponse,
  PrecedentTreatmentItem,
  StatutoryInterpretationItem,
} from '@/types/headnote';

interface CaseHeadnoteCardProps {
  cnr: string;
  selectedFilename?: string | null;
  orderTitle?: string | null;
}

export const CaseHeadnoteCard: React.FC<CaseHeadnoteCardProps> = ({
  cnr,
  selectedFilename,
  orderTitle,
}) => {
  const [data, setData] = useState<CaseHeadnoteResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showFullRatio, setShowFullRatio] = useState<boolean>(false);
  const [showObiter, setShowObiter] = useState<boolean>(false);

  const fetchHeadnote = async (force: boolean = false) => {
    if (!cnr) return;
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const resp = force
        ? await headnoteService.refreshHeadnote(cnr, selectedFilename)
        : await headnoteService.getHeadnote(cnr, selectedFilename);
      setData(resp);
      if (force && resp) {
        toast.success('Editorial headnote regenerated.');
      }
    } catch {
      // Gracefully fall back to null
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHeadnote(false);
  }, [cnr, selectedFilename]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyCitation = () => {
    if (!data || !data.headnote) return;
    const h = data.headnote;
    const lines = [
      `=== SUITS LAW REPORT: EDITORIAL HEADNOTE ===`,
      `CNR: ${data.target_cnr}`,
      `Order: ${data.order_title || 'Judgment'}`,
      `Operative Disposition: ${h.operative_disposition}`,
      ``,
      `CATCHWORDS:`,
      h.catchwords.join(' — '),
      ``,
      `HELD:`,
      ...h.held_points.map((pt, i) => `${i + 1}. ${pt}`),
      ``,
      `RATIO DECIDENDI SUMMARY:`,
      h.ratio_decidendi_summary,
      ``,
      ...(h.precedent_citator_table.length > 0
        ? [
            `PRECEDENTS TREATED:`,
            ...h.precedent_citator_table.map(
              (p) => `• [${p.treatment}] ${p.precedent_name} — ${p.bench_commentary}`
            ),
            ``,
          ]
        : []),
      `[Source: SUITS AI Court Intelligence · InLegalBERT & Gemini 3.6]`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopied(true);
    toast.success('Citation & Headnote copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2200);
  };

  const getTreatmentBadgeClass = (treatment: string) => {
    switch (treatment.toUpperCase()) {
      case 'OVERRULED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'FOLLOWED':
      case 'RELIED ON':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'DISTINGUISHED':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'EXPLAINED':
      case 'REFERRED':
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
  };

  const getInterpretationBadgeClass = (nature: string) => {
    switch (nature.toUpperCase()) {
      case 'STRICT':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'PURPOSIVE':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'HARMONIOUS':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'READ_DOWN':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  };

  // If loading and no prior data
  if (loading && !data) {
    return (
      <div
        className="rounded-2xl border p-6 transition-all animate-pulse"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--hairline)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-56 bg-slate-700/40 rounded-lg"></div>
          <div className="h-8 w-24 bg-slate-700/40 rounded-lg"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-700/30 rounded"></div>
          <div className="h-4 w-5/6 bg-slate-700/30 rounded"></div>
          <div className="h-20 w-full bg-slate-700/20 rounded-xl mt-4"></div>
        </div>
      </div>
    );
  }

  // Gracefully degrade if no headnote generated (e.g. non-substantive procedural stub)
  if (!data || !data.headnote) {
    return null;
  }

  const { headnote } = data;

  return (
    <div
      className="relative rounded-2xl border transition-all duration-300 overflow-hidden shadow-xl"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 15, 29, 0.95) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.25)', // Subtle legal gold hairline
      }}
    >
      {/* Top Banner Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500/40 via-yellow-400/80 to-amber-500/40" />

      <div className="p-6 md:p-8 space-y-6">
        {/* Header with Title, Publisher Badge, and Copy Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm">
                <Scale className="w-5 h-5" />
              </span>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                Editorial Headnote & Ratio Decidendi
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-300 border border-amber-400/20">
                SCC / AIR Standard
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Order: <strong className="text-slate-200">{data.order_title || orderTitle || 'Judgment'}</strong></span>
              <span>•</span>
              <span>Disposition: <strong className="text-amber-300 font-medium">{headnote.operative_disposition}</strong></span>
              {data.order_date && (
                <>
                  <span>•</span>
                  <span>Decided: {data.order_date}</span>
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleCopyCitation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 transition-all duration-200 shadow-sm active:scale-95"
              title="Copy citation and headnote for court petition"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy Headnote'}</span>
            </button>

            <button
              onClick={() => fetchHeadnote(true)}
              disabled={refreshing}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/5 transition-all duration-200 disabled:opacity-50"
              title="Regenerate headnote"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Catchwords Hierarchy Strip */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Subject & Catchwords Hierarchy</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {headnote.catchwords.map((cw, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700/60 shadow-sm flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                {cw}
              </span>
            ))}
          </div>
        </div>

        {/* Held Points (Pure Ratio Decidendi) */}
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Held (Judicial Holdings of Law)</span>
          </div>

          <div className="space-y-2.5">
            {headnote.held_points.map((point, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex gap-3.5 items-start"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 text-amber-300 font-semibold text-xs flex items-center justify-center border border-amber-500/20 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Precedent Citator Table */}
        {headnote.precedent_citator_table && headnote.precedent_citator_table.length > 0 && (
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Precedents Cited & Judicial Treatment ({headnote.precedent_citator_table.length})</span>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-300 font-semibold uppercase tracking-wider text-[10px] border-b border-white/5">
                    <tr>
                      <th className="py-2.5 px-4">Authority Cited</th>
                      <th className="py-2.5 px-3">Treatment</th>
                      <th className="py-2.5 px-4">Court Analysis / Specific Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {headnote.precedent_citator_table.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-100 whitespace-nowrap sm:whitespace-normal">
                          {item.precedent_name}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${getTreatmentBadgeClass(
                              item.treatment
                            )}`}
                          >
                            {item.treatment}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 leading-normal">
                          <div>{item.bench_commentary}</div>
                          {item.overruled_specific_ratio && (
                            <div className="mt-1 text-[11px] text-rose-300/90 italic">
                              Overruled proposition: {item.overruled_specific_ratio}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Statutory Provisions Interpreted */}
        {headnote.statutory_provisions_considered && headnote.statutory_provisions_considered.length > 0 && (
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Statutory Provisions Interpreted</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {headnote.statutory_provisions_considered.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-between space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-white">
                      {stat.section_article}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getInterpretationBadgeClass(
                        stat.nature_of_interpretation
                      )}`}
                    >
                      {stat.nature_of_interpretation}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">{stat.act_name}</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-white/5">
                    {stat.interpretation_summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ratio Decidendi In-Depth Summary & Obiter Dicta Accordions */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          {/* Full Ratio Toggle */}
          <div>
            <button
              onClick={() => setShowFullRatio(!showFullRatio)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-xs text-slate-300 font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>In-Depth Ratio Decidendi Analysis</span>
              </span>
              {showFullRatio ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showFullRatio && (
              <div className="p-4 mt-1.5 rounded-xl border border-white/5 bg-slate-950/40 text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
                {headnote.ratio_decidendi_summary}
              </div>
            )}
          </div>

          {/* Obiter Dicta Toggle */}
          {headnote.obiter_dicta && headnote.obiter_dicta.length > 0 && (
            <div>
              <button
                onClick={() => setShowObiter(!showObiter)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-xs text-slate-400 font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>Obiter Dicta ({headnote.obiter_dicta.length} non-binding observations)</span>
                </span>
                {showObiter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showObiter && (
                <div className="p-4 mt-1.5 rounded-xl border border-white/5 bg-slate-950/40 space-y-2">
                  {headnote.obiter_dicta.map((ob, idx) => (
                    <div key={idx} className="text-xs text-slate-400 flex gap-2">
                      <span className="text-amber-400/70">•</span>
                      <span>{ob}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Attribution */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/5">
          <span>{data.model_attribution}</span>
          <span className="font-mono text-slate-400">Hash: {data.order_hash}</span>
        </div>
      </div>
    </div>
  );
};
