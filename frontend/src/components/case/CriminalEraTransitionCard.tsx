import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Scale,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { eraTransitionService } from '@/services/eraTransition';
import type {
  EraTransitionCaseAnalysis,
  StatuteConcordancePair,
  PrecedentTranspositionItem,
  StatutoryDelta,
} from '@/types/era_transition';

interface CriminalEraTransitionCardProps {
  cnr: string;
}

export const CriminalEraTransitionCard: React.FC<CriminalEraTransitionCardProps> = ({ cnr }) => {
  const [data, setData] = useState<EraTransitionCaseAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedPairs, setExpandedPairs] = useState<Record<string, boolean>>({});
  const [expandedPrecedents, setExpandedPrecedents] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'transpositions' | 'concordance' | 'deltas'>('transpositions');

  const fetchAnalysis = async (force: boolean = false) => {
    if (!cnr) return;
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const resp = force
        ? await eraTransitionService.refreshCaseEraTransition(cnr)
        : await eraTransitionService.getCaseEraTransition(cnr);
      setData(resp);
      if (force && resp) {
        toast.success('Era transition analysis refreshed.');
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(false);
  }, [cnr]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyPleading = (text: string, index: number, title: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(`Copied transposed pleading for ${title} to clipboard.`);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2500);
  };

  const togglePair = (id: string) => {
    setExpandedPairs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePrecedent = (idx: number) => {
    setExpandedPrecedents((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/60 p-6 backdrop-blur-md animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/20" />
            <div className="space-y-1.5">
              <div className="h-4 w-48 rounded bg-muted/60" />
              <div className="h-3 w-72 rounded bg-muted/40" />
            </div>
          </div>
          <div className="h-6 w-28 rounded-full bg-muted/50" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-20 rounded-lg bg-muted/20" />
          <div className="h-20 rounded-lg bg-muted/20" />
        </div>
      </div>
    );
  }

  if (!data || (data.concordance_mappings.length === 0 && data.transposed_precedents.length === 0)) {
    return null;
  }

  const getEraBadge = () => {
    switch (data.active_era) {
      case 'NEW_BNS_ERA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            BNS / BNSS / BSA ERA (Post-July 2024)
          </span>
        );
      case 'HYBRID_TRANSITION_ERA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            HYBRID TRANSITIONAL JURISPRUDENCE
          </span>
        );
      case 'LEGACY_IPC_ERA':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            LEGACY COLONIAL CODES ERA (IPC/CrPC/IEA)
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card/90 via-card/60 to-background/80 shadow-lg backdrop-blur-md overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                Criminal Law Era Transition Engine
              </h3>
              {getEraBadge()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              IPC/CrPC/IEA ⇄ BNS/BNSS/BSA Concordance & Supreme Court Precedent Transposition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => fetchAnalysis(true)}
            disabled={refreshing}
            title="Refresh transition matrix"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Era Explanation Banner */}
      <div className="px-5 py-3 bg-muted/10 border-b border-border/30 text-xs text-muted-foreground/90 flex items-start gap-2.5">
        <Scale className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-medium text-foreground">Era Context: </span>
          {data.era_explanation}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-5 pt-3 border-b border-border/30 flex items-center gap-2 bg-muted/5">
        <button
          onClick={() => setActiveTab('transpositions')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'transpositions'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileCheck className="h-3.5 w-3.5" />
          Transposed Pleading Arguments ({data.transposed_precedents.length})
        </button>
        <button
          onClick={() => setActiveTab('concordance')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'concordance'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Statutory Concordance Bridge ({data.concordance_mappings.length})
        </button>
        <button
          onClick={() => setActiveTab('deltas')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'deltas'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          Statutory Variations & Risks ({data.procedural_risks.length})
        </button>
      </div>

      {/* Tab 1: Transposed Pleading Arguments */}
      {activeTab === 'transpositions' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
            <span>
              Supreme Court ratios decided under legacy codes formally transposed to bind the bench under BNS/BNSS/BSA:
            </span>
            <span className="flex items-center gap-1 text-[11px] text-primary">
              <Sparkles className="h-3 w-3" />
              General Clauses Act S. 8 / Pari Materia
            </span>
          </div>

          <div className="space-y-4">
            {data.transposed_precedents.map((item, idx) => {
              const isExpanded = expandedPrecedents[idx] ?? true;
              const isCopied = copiedIndex === idx;

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border/50 bg-muted/15 overflow-hidden transition-all duration-200 hover:border-border/80"
                >
                  <div
                    onClick={() => togglePrecedent(idx)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                        §
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {item.precedent_title}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted font-mono text-muted-foreground">
                            {item.citation}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className="font-medium text-amber-400/90">{item.historic_section_cited}</span>
                          <ArrowLeftRight className="h-3 w-3 text-muted-foreground/60" />
                          <span className="font-semibold text-emerald-400">{item.transposed_section}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="italic">{item.governing_doctrine}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPleading(item.court_pleading_paragraph, idx, item.precedent_title);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-colors"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy Pleading'}</span>
                      </button>
                      <button className="text-muted-foreground hover:text-foreground p-1">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-3 border-t border-border/30 bg-background/40">
                      {/* Persuasion Ratio Banner */}
                      <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2 text-xs">
                        <Scale className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground">Oral Argument Proposition: </span>
                          <span className="text-muted-foreground">{item.persuasion_ratio}</span>
                        </div>
                      </div>

                      {/* Ready Pleading Submission */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground/80 font-medium">
                          <span>Court Pleading Paragraph (Direct Insert):</span>
                          <span className="font-mono text-xs text-primary/80">{item.statutory_continuity_basis}</span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-muted/30 border border-border/40 text-xs leading-relaxed text-foreground font-serif tracking-normal selection:bg-primary/20">
                          {item.court_pleading_paragraph}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Statutory Concordance Bridge */}
      {activeTab === 'concordance' && (
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.concordance_mappings.map((pair) => {
              const isExpanded = expandedPairs[pair.id] ?? false;

              return (
                <div
                  key={pair.id}
                  className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3 hover:border-border transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                      {pair.category}
                    </span>
                    {pair.similarity_score && (
                      <span className="text-[10px] text-primary font-mono">
                        Doctrine Sim: {(pair.similarity_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Bridge visual */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-background/60 border border-border/40">
                    <div className="text-left">
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">{pair.old_code}</div>
                      <div className="text-sm font-bold text-amber-400">S. {pair.old_section}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-[120px]">
                        {pair.old_title}
                      </div>
                    </div>

                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />

                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">{pair.new_code}</div>
                      <div className="text-sm font-bold text-emerald-400">S. {pair.new_section}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-[120px]">
                        {pair.new_title}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-foreground">{pair.concept_doctrine}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{pair.doctrine_summary}</div>
                  </div>

                  {pair.statutory_deltas.length > 0 && (
                    <div className="pt-2 border-t border-border/30">
                      <button
                        onClick={() => togglePair(pair.id)}
                        className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide' : 'View'} Statutory Variations ({pair.statutory_deltas.length})</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          {pair.statutory_deltas.map((delta, dIdx) => (
                            <div key={dIdx} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
                              <div className="font-medium text-amber-300">{delta.provision_name}</div>
                              <p className="text-muted-foreground mt-0.5">{delta.details}</p>
                              <div className="mt-1.5 text-[11px] text-amber-200/90 font-medium">
                                ⚠ {delta.litigator_warning}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Statutory Variations & Risks */}
      {activeTab === 'deltas' && (
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium pb-1">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Procedural Discrepancies & Litigator Risk Warnings for this Matter:</span>
          </div>

          <div className="space-y-2.5">
            {data.procedural_risks.map((risk, rIdx) => (
              <div
                key={rIdx}
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs leading-relaxed text-foreground"
              >
                <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0 mt-0.5">
                  !
                </div>
                <div>{risk}</div>
              </div>
            ))}
          </div>

          {data.statutory_deltas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detailed Enacted Provisos & Changes:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.statutory_deltas.map((delta, dIdx) => (
                  <div key={dIdx} className="p-3 rounded-lg bg-muted/20 border border-border/40 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{delta.provision_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {delta.delta_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{delta.details}</p>
                    <p className="text-amber-400/90 text-[11px] font-medium">
                      Alert: {delta.litigator_warning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Attribution */}
      <div className="px-5 py-2.5 bg-muted/25 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 text-primary" />
          Powered by InLegalBERT Mode 1 Whitening & isolated Gemini 3.6 Flash
        </span>
        <span>Generated: {new Date(data.generated_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
