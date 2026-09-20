/**
 * CriminalEraTransitionCard — IPC/CrPC/IEA ↔ BNS/BNSS/BSA Concordance Engine
 *
 * Architecture:
 * Phase 1 (Instant, 0 tokens): Load concordance section-mapping table from the
 *   static Python dictionary via /era-transition/instant. Shows the IPC→BNS table,
 *   era badge, procedural risk alerts, and landmark precedents immediately.
 *
 * Phase 2 (On-Demand, LLM): User clicks "Draft Transition Arguments" →
 *   triggers /era-transition which calls Gemini to draft court-ready pleading
 *   paragraphs transposing the Supreme Court ratios to the new sections.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Sparkles,
  Loader2,
  Gavel,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { eraTransitionService } from '@/services/eraTransition';
import type {
  EraTransitionInstant,
  EraTransitionCaseAnalysis,
  StatuteConcordancePair,
  StatutoryDelta,
  PrecedentTranspositionItem,
} from '@/types/era_transition';

interface CriminalEraTransitionCardProps {
  cnr: string;
}

type ActiveTab = 'concordance' | 'transpositions' | 'deltas';

export const CriminalEraTransitionCard: React.FC<CriminalEraTransitionCardProps> = ({ cnr }) => {
  // Phase 1: instant concordance (static dict, 0 tokens)
  const [instant, setInstant] = useState<EraTransitionInstant | null>(null);
  const [loadingInstant, setLoadingInstant] = useState<boolean>(true);

  // Phase 2: LLM-drafted pleading arguments (on-demand only)
  const [fullAnalysis, setFullAnalysis] = useState<EraTransitionCaseAnalysis | null>(null);
  const [loadingPleadings, setLoadingPleadings] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('concordance');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedPairs, setExpandedPairs] = useState<Record<string, boolean>>({});
  const [expandedPrecedents, setExpandedPrecedents] = useState<Record<number, boolean>>({});

  // ── Phase 1: fetch instant concordance on mount ───────────────────────────
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!cnr) return;
      setLoadingInstant(true);
      try {
        const data = await eraTransitionService.getInstantConcordance(cnr);
        if (isMounted) setInstant(data);
      } catch {
        if (isMounted) setInstant(null);
      } finally {
        if (isMounted) setLoadingInstant(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [cnr]);

  // ── Phase 2: draft pleadings on-demand ───────────────────────────────────
  const handleDraftPleadings = async () => {
    if (loadingPleadings || !cnr) return;
    setLoadingPleadings(true);
    setActiveTab('transpositions');
    try {
      const data = await eraTransitionService.getCaseEraTransition(cnr);
      if (data) {
        setFullAnalysis(data);
        toast.success('Transition arguments drafted by Gemini.');
      } else {
        toast.info('Pleading synthesis unavailable for this matter.');
      }
    } catch {
      toast.error('Failed to draft transition arguments.');
    } finally {
      setLoadingPleadings(false);
    }
  };

  const handleRefreshPleadings = async () => {
    if (refreshing || !cnr) return;
    setRefreshing(true);
    try {
      const data = await eraTransitionService.refreshCaseEraTransition(cnr);
      if (data) {
        setFullAnalysis(data);
        toast.success('Transition analysis refreshed.');
      }
    } catch {
      toast.error('Failed to refresh transition analysis.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyPleading = (text: string, index: number, title: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(`Copied transposed pleading for ${title} to clipboard.`);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const togglePair = (id: string) =>
    setExpandedPairs((prev) => ({ ...prev, [id]: !prev[id] }));

  const togglePrecedent = (idx: number) =>
    setExpandedPrecedents((prev) => ({ ...prev, [idx]: !prev[idx] }));

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (loadingInstant) {
    return (
      <div className="card-float p-6 sm:p-8 space-y-4 animate-pulse" style={{ borderRadius: 'var(--radius-md)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg" style={{ background: 'var(--surface-raised)' }} />
            <div className="space-y-1.5">
              <div className="h-4 w-52 rounded" style={{ background: 'var(--surface-raised)' }} />
              <div className="h-3 w-72 rounded" style={{ background: 'var(--surface-raised)' }} />
            </div>
          </div>
          <div className="h-7 w-36 rounded-full" style={{ background: 'var(--surface-raised)' }} />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-16 rounded-lg" style={{ background: 'var(--surface-raised)' }} />
          <div className="h-16 rounded-lg" style={{ background: 'var(--surface-raised)' }} />
        </div>
      </div>
    );
  }

  // ── Not applicable (no concordance pairs found for this matter) ───────────
  if (!instant || instant.concordance_mappings.length === 0) {
    return null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const era = instant.active_era;
  const concordanceMappings = instant.concordance_mappings;
  const proceduralRisks = instant.procedural_risks;
  const transposedPrecedents = fullAnalysis?.transposed_precedents ?? [];

  // Merge statutory_deltas from all concordance pairs
  const allDeltas: StatutoryDelta[] = concordanceMappings.flatMap((p) => p.statutory_deltas);

  const getEraBadge = () => {
    switch (era) {
      case 'NEW_BNS_ERA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(39, 174, 96, 0.12)', color: '#27ae60', border: '1px solid rgba(39, 174, 96, 0.3)' }}>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            BNS / BNSS / BSA ERA
          </span>
        );
      case 'HYBRID_TRANSITION_ERA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(242, 201, 76, 0.12)', color: '#d48806', border: '1px solid rgba(242, 201, 76, 0.3)' }}>
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            HYBRID TRANSITIONAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(62, 124, 166, 0.12)', color: 'var(--brass)', border: '1px solid rgba(62, 124, 166, 0.3)' }}>
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--brass)' }} />
            LEGACY IPC / CrPC / IEA
          </span>
        );
    }
  };

  const tabCount = {
    concordance: concordanceMappings.length,
    transpositions: transposedPrecedents.length,
    deltas: proceduralRisks.length,
  };

  return (
    <div
      id="era-transition-section"
      className="card-float overflow-hidden"
      style={{ borderRadius: 'var(--radius-md)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="p-5 sm:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-3"
        style={{ borderColor: 'var(--hairline)', background: 'var(--surface-raised)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--brass-soft)', color: 'var(--brass-bright)', border: '1px solid var(--hairline)' }}
          >
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                Criminal Law Era Transition Engine
              </h3>
              {getEraBadge()}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>
              IPC/CrPC/IEA ⇄ BNS/BNSS/BSA Concordance • Instant Section Mapping • On-Demand Pleading Synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Draft Pleadings button — only if not yet generated */}
          {!fullAnalysis && (
            <button
              onClick={handleDraftPleadings}
              disabled={loadingPleadings}
              className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
              style={{
                background: 'var(--brass-soft)',
                color: 'var(--brass-bright)',
                border: '1px solid var(--hairline)',
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
              }}
              title="Draft court-ready transition arguments using Gemini (LLM call)"
            >
              {loadingPleadings ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{loadingPleadings ? 'Drafting Arguments…' : 'Draft Transition Arguments'}</span>
            </button>
          )}

          {/* Refresh button (only shown after pleadings generated) */}
          {fullAnalysis && (
            <button
              onClick={handleRefreshPleadings}
              disabled={refreshing}
              className="btn btn-ghost flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all"
              style={{ border: '1px solid var(--hairline)', padding: '6px 12px', color: 'var(--ink-dim)' }}
              title="Re-run Gemini transition analysis"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} style={{ color: refreshing ? 'var(--brass)' : undefined }} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Era Context Banner ─────────────────────────────────────────────── */}
      <div
        className="px-5 py-3 border-b text-xs flex items-start gap-2.5"
        style={{ background: 'var(--surface)', borderColor: 'var(--hairline)', color: 'var(--ink-dim)' }}
      >
        <Scale className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} />
        <div>
          <span className="font-semibold" style={{ color: 'var(--ink)' }}>Era Context: </span>
          {instant.era_explanation}
        </div>
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────────────── */}
      <div
        className="px-5 pt-3 border-b flex items-center gap-2 overflow-x-auto scrollbar-none"
        style={{ background: 'var(--surface)', borderColor: 'var(--hairline)' }}
      >
        {([
          { id: 'concordance', label: `Section Concordance (${tabCount.concordance})`, icon: <ArrowLeftRight size={13} /> },
          { id: 'deltas', label: `Procedural Risks (${tabCount.deltas})`, icon: <AlertTriangle size={13} /> },
          { id: 'transpositions', label: fullAnalysis ? `Pleading Arguments (${tabCount.transpositions})` : 'Pleading Arguments', icon: <FileCheck size={13} /> },
        ] as const).map(({ id, label, icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              style={{
                borderColor: isActive ? 'var(--brass)' : 'transparent',
                color: isActive ? 'var(--brass-bright)' : 'var(--ink-faint)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: SECTION CONCORDANCE TABLE ─────────────────────────────── */}
      {activeTab === 'concordance' && (
        <div className="p-5 space-y-3">
          <div
            className="text-xs pb-2 flex items-center gap-2"
            style={{ color: 'var(--ink-faint)' }}
          >
            <Layers size={13} style={{ color: 'var(--brass)' }} />
            <span>Bi-directional section mapping resolved instantly from the statutory concordance dictionary (0 tokens).</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {concordanceMappings.map((pair: StatuteConcordancePair) => {
              const isExpanded = expandedPairs[pair.id] ?? false;

              return (
                <div
                  key={pair.id}
                  className="rounded-lg border space-y-3 p-4 hover:border-[var(--brass)] transition-colors"
                  style={{ background: 'var(--surface)', borderColor: 'var(--hairline)' }}
                >
                  {/* Category badge + doctrine score */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded uppercase font-mono"
                      style={{ background: 'var(--surface-raised)', color: 'var(--ink-faint)', border: '1px solid var(--hairline)' }}
                    >
                      {pair.category}
                    </span>
                    {pair.similarity_score && (
                      <span className="text-[10px] font-mono" style={{ color: 'var(--ink-faint)' }}>
                        Doctrine sim: {(pair.similarity_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Section Bridge Visual */}
                  <div
                    className="flex items-center justify-between gap-2 p-3 rounded-lg border"
                    style={{ background: 'var(--surface-raised)', borderColor: 'var(--hairline)' }}
                  >
                    <div className="text-left">
                      <div className="text-[10px] uppercase tracking-wide font-mono" style={{ color: 'var(--ink-faint)' }}>{pair.old_code}</div>
                      <div className="text-sm font-bold" style={{ color: '#d48806' }}>S. {pair.old_section}</div>
                      <div className="text-[11px] line-clamp-1 max-w-[120px]" style={{ color: 'var(--ink-dim)' }}>{pair.old_title}</div>
                    </div>

                    <ArrowLeftRight className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-faint)' }} />

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide font-mono" style={{ color: 'var(--ink-faint)' }}>{pair.new_code}</div>
                      <div className="text-sm font-bold" style={{ color: '#27ae60' }}>S. {pair.new_section}</div>
                      <div className="text-[11px] line-clamp-1 max-w-[120px]" style={{ color: 'var(--ink-dim)' }}>{pair.new_title}</div>
                    </div>
                  </div>

                  {/* Doctrine */}
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{pair.concept_doctrine}</div>
                    <div className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--ink-dim)' }}>
                      {pair.doctrine_summary}
                    </div>
                  </div>

                  {/* Landmark Precedents (instant, from static dict) */}
                  {pair.landmark_precedents.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: 'var(--hairline-soft)' }}>
                      <div className="text-[10.5px] uppercase tracking-wider font-semibold font-mono" style={{ color: 'var(--ink-faint)' }}>
                        Landmark Precedents
                      </div>
                      {pair.landmark_precedents.slice(0, 2).map((prec, pIdx) => (
                        <div key={pIdx} className="text-xs space-y-0.5">
                          <span className="font-semibold" style={{ color: 'var(--ink)' }}>{prec.title}</span>
                          <span className="font-mono ml-1.5 text-[11px]" style={{ color: 'var(--ink-faint)' }}>{prec.citation}</span>
                          {isExpanded && (
                            <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'var(--ink-dim)' }}>
                              {prec.ratio}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expand/Collapse toggle */}
                  {(pair.statutory_deltas.length > 0 || pair.landmark_precedents.length > 0) && (
                    <div className="pt-1 border-t" style={{ borderColor: 'var(--hairline-soft)' }}>
                      <button
                        onClick={() => togglePair(pair.id)}
                        className="text-[11px] font-medium flex items-center gap-1 transition-colors"
                        style={{ color: 'var(--brass-bright)' }}
                      >
                        <span>{isExpanded ? 'Hide details' : `View details & ${pair.statutory_deltas.length} statutory variations`}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {isExpanded && pair.statutory_deltas.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {pair.statutory_deltas.map((delta, dIdx) => (
                            <div
                              key={dIdx}
                              className="p-2.5 rounded-lg border text-xs"
                              style={{ background: 'rgba(242, 201, 76, 0.06)', borderColor: 'rgba(242, 201, 76, 0.25)' }}
                            >
                              <div className="font-semibold" style={{ color: '#d48806' }}>{delta.provision_name}</div>
                              <p className="mt-0.5" style={{ color: 'var(--ink-dim)' }}>{delta.details}</p>
                              <div className="mt-1.5 text-[11px] font-medium" style={{ color: '#eb5757' }}>
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

          {/* CTA for pleadings if not yet drafted */}
          {!fullAnalysis && (
            <div
              className="mt-4 p-4 rounded-lg border text-xs flex items-center justify-between gap-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--hairline)', color: 'var(--ink-dim)' }}
            >
              <div className="flex items-start gap-2">
                <Gavel size={15} style={{ color: 'var(--brass)', flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong style={{ color: 'var(--ink)' }}>Transposed Pleading Arguments not yet drafted.</strong>{' '}
                  Click "Draft Transition Arguments" to have Gemini synthesize court-ready submissions that transpose
                  the Supreme Court ratios to their BNS/BNSS/BSA equivalents via General Clauses Act S. 8 &amp; pari materia doctrine.
                </span>
              </div>
              <button
                onClick={handleDraftPleadings}
                disabled={loadingPleadings}
                className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer transition-all disabled:opacity-50"
                style={{ color: 'var(--brass-bright)', padding: '6px 13px', borderRadius: 'var(--radius-sm)', background: 'var(--brass-soft)', border: '1px solid var(--hairline)' }}
              >
                {loadingPleadings ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>{loadingPleadings ? 'Drafting…' : 'Draft Now'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PROCEDURAL RISKS ───────────────────────────────────────── */}
      {activeTab === 'deltas' && (
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium pb-1" style={{ color: '#d48806' }}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Procedural Discrepancies & Litigator Risk Warnings for this Matter:</span>
          </div>

          <div className="space-y-2.5">
            {proceduralRisks.map((risk, rIdx) => (
              <div
                key={rIdx}
                className="p-3.5 rounded-lg border flex items-start gap-3 text-xs leading-relaxed"
                style={{ background: 'rgba(242, 201, 76, 0.06)', borderColor: 'rgba(242, 201, 76, 0.25)', color: 'var(--ink)' }}
              >
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5"
                  style={{ background: 'rgba(242, 201, 76, 0.2)', color: '#d48806' }}
                >
                  !
                </div>
                <div>{risk}</div>
              </div>
            ))}
          </div>

          {/* Detailed delta breakdown */}
          {allDeltas.length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--hairline)' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
                Detailed Enacted Provisos & Statutory Changes:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allDeltas.map((delta: StatutoryDelta, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-3.5 rounded-lg border text-xs space-y-1.5"
                    style={{ background: 'var(--surface)', borderColor: 'var(--hairline)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: 'var(--ink)' }}>{delta.provision_name}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: 'var(--surface-raised)', color: 'var(--ink-faint)', border: '1px solid var(--hairline)' }}
                      >
                        {delta.delta_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p style={{ color: 'var(--ink-dim)' }}>{delta.details}</p>
                    <p className="text-[11px] font-medium" style={{ color: '#eb5757' }}>
                      Alert: {delta.litigator_warning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: TRANSPOSED PLEADING ARGUMENTS (on-demand LLM) ────────── */}
      {activeTab === 'transpositions' && (
        <div className="p-5 space-y-4">
          {/* Not yet generated state */}
          {!fullAnalysis && !loadingPleadings && (
            <div
              className="py-12 flex flex-col items-center gap-4 rounded-lg border text-center"
              style={{ background: 'var(--surface)', borderColor: 'var(--hairline)', color: 'var(--ink-faint)' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'var(--brass-soft)', border: '1px solid var(--hairline)' }}
              >
                <Sparkles size={22} style={{ color: 'var(--brass-bright)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  Transposed Pleading Arguments Not Yet Drafted
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)', maxWidth: 380 }}>
                  Click below to have Gemini draft court-ready pleadings that transpose each Supreme Court
                  ratio to its BNS/BNSS/BSA equivalent via General Clauses Act S. 8 & pari materia doctrine.
                  This is an LLM call — only trigger when you need it.
                </p>
              </div>
              <button
                onClick={handleDraftPleadings}
                className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all"
                style={{ background: 'var(--brass-soft)', color: 'var(--brass-bright)', border: '1px solid var(--hairline)', padding: '8px 20px', borderRadius: 'var(--radius-sm)' }}
              >
                <Sparkles size={13} />
                <span>Draft Transition Arguments</span>
              </button>
            </div>
          )}

          {/* Loading state */}
          {loadingPleadings && (
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--brass-bright)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--ink-dim)' }}>
                Gemini is drafting court-ready transition pleadings…
              </p>
            </div>
          )}

          {/* Pleadings list */}
          {fullAnalysis && !loadingPleadings && (
            <>
              <div className="flex items-center justify-between text-xs pb-1" style={{ color: 'var(--ink-faint)' }}>
                <span>
                  Supreme Court ratios formally transposed to BNS/BNSS/BSA — ready to copy-paste into petitions:
                </span>
                <span className="flex items-center gap-1" style={{ color: 'var(--brass-bright)' }}>
                  <Sparkles className="h-3 w-3" />
                  Gen. Clauses Act S. 8 / Pari Materia
                </span>
              </div>

              <div className="space-y-4">
                {transposedPrecedents.map((item: PrecedentTranspositionItem, idx: number) => {
                  const isExpanded = expandedPrecedents[idx] ?? true;
                  const isCopied = copiedIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="rounded-lg border overflow-hidden transition-all"
                      style={{ borderColor: 'var(--hairline)', background: 'var(--surface)' }}
                    >
                      <div
                        onClick={() => togglePrecedent(idx)}
                        className="p-4 flex items-center justify-between cursor-pointer select-none"
                        style={{ background: 'var(--surface-raised)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ background: 'var(--brass-soft)', color: 'var(--brass-bright)', border: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)' }}
                          >
                            §
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{item.precedent_title}</span>
                              <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'var(--surface)', color: 'var(--ink-faint)', border: '1px solid var(--hairline)' }}>
                                {item.citation}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--ink-faint)' }}>
                              <span className="font-medium" style={{ color: '#d48806' }}>{item.historic_section_cited}</span>
                              <ArrowLeftRight className="h-3 w-3" />
                              <span className="font-semibold" style={{ color: '#27ae60' }}>{item.transposed_section}</span>
                              <span style={{ color: 'var(--hairline)' }}>•</span>
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
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                            style={{
                              background: isCopied ? 'rgba(39, 174, 96, 0.12)' : 'var(--brass-soft)',
                              color: isCopied ? '#27ae60' : 'var(--brass-bright)',
                              border: '1px solid var(--hairline)',
                            }}
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{isCopied ? 'Copied' : 'Copy Pleading'}</span>
                          </button>
                          <button className="p-1" style={{ color: 'var(--ink-faint)' }}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--hairline)' }}>
                          {/* Oral argument proposition */}
                          <div
                            className="p-2.5 rounded-lg border flex items-start gap-2 text-xs"
                            style={{ background: 'var(--surface-raised)', borderColor: 'var(--hairline)' }}
                          >
                            <Scale className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} />
                            <div>
                              <span className="font-semibold" style={{ color: 'var(--ink)' }}>Oral Argument Proposition: </span>
                              <span style={{ color: 'var(--ink-dim)' }}>{item.persuasion_ratio}</span>
                            </div>
                          </div>

                          {/* Court Pleading Paragraph */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold font-mono" style={{ color: 'var(--ink-faint)' }}>
                              <span>Court Pleading Paragraph (Direct Insert):</span>
                              <span style={{ color: 'var(--brass-bright)' }}>{item.statutory_continuity_basis}</span>
                            </div>
                            <div
                              className="p-3.5 rounded-lg border text-xs leading-relaxed font-serif tracking-normal"
                              style={{ background: 'var(--surface-raised)', borderColor: 'var(--hairline)', color: 'var(--ink)' }}
                            >
                              {item.court_pleading_paragraph}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Footer Attribution ────────────────────────────────────────────── */}
      <div
        className="px-5 py-2.5 border-t flex items-center justify-between text-[11px]"
        style={{ background: 'var(--surface-raised)', borderColor: 'var(--hairline)', color: 'var(--ink-faint)' }}
      >
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-3 w-3" style={{ color: 'var(--brass)' }} />
          Phase 1: Static Concordance Dict (0 tokens) •{' '}
          {fullAnalysis ? (
            <span>Phase 2: {fullAnalysis.model_attribution ?? 'Gemini'} (on-demand)</span>
          ) : (
            <span>Phase 2: Pleading synthesis available on-demand</span>
          )}
        </span>
        {fullAnalysis?.generated_at && (
          <span>Pleadings: {new Date(fullAnalysis.generated_at).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};
