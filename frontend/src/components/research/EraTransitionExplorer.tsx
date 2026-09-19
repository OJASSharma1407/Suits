import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowLeftRight,
  Scale,
  BookOpen,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { eraTransitionService } from '@/services/eraTransition';
import type { StatuteConcordancePair } from '@/types/era_transition';

export const EraTransitionExplorer: React.FC = () => {
  const [query, setQuery] = useState<string>('438');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [results, setResults] = useState<StatuteConcordancePair[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const doSearch = async (q: string) => {
    setLoading(true);
    try {
      const resp = await eraTransitionService.lookupConcordance(q || '438', 20);
      if (resp && Array.isArray(resp.pairs)) {
        setResults(resp.pairs);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    doSearch('438');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyArgument = (pair: StatuteConcordancePair) => {
    const landmark = pair.landmark_precedents[0];
    const text =
      `It is respectfully submitted before this Hon'ble Court that while the instant proceeding is styled ` +
      `under ${pair.new_code} Section ${pair.new_section}, the governing constitutional and statutory principle is squarely ` +
      `settled by the Hon'ble Supreme Court in ${landmark?.title || 'landmark precedent'} [${landmark?.citation || ''}]. ` +
      `By operation of Section 8 of the General Clauses Act, 1897, where any Central Act repeals and re-enacts with or ` +
      `without modification any provision of a former enactment, references to the repealed provision shall be construed ` +
      `as references to the provision so re-enacted. Furthermore, ${pair.new_code} Section ${pair.new_section} maintains ` +
      `pari materia identity with erstwhile ${pair.old_code} Section ${pair.old_section}. Consequently, the ratio decidendi ` +
      `in ${landmark?.title || ''}—mandating that ${landmark?.ratio || pair.doctrine_summary}—remains binding under ` +
      `Article 141 of the Constitution of India and strictly governs the adjudication of this matter.`;

    navigator.clipboard.writeText(text);
    setCopiedId(pair.id);
    toast.success(`Copied transposed court argument for Section ${pair.new_section} ${pair.new_code} to clipboard.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredResults = results.filter((pair) => {
    if (categoryFilter === 'ALL') return true;
    return pair.category === categoryFilter;
  });

  const quickSearches = [
    { label: 'Anticipatory Bail (438 ⇄ 482)', query: '438' },
    { label: '41A Arrest Notice (41A ⇄ 35(3))', query: '41A' },
    { label: 'FIR Registration (154 ⇄ 173)', query: '154' },
    { label: 'Videography Search (105 BNSS)', query: 'videography' },
    { label: 'Undertrial Bail (436A ⇄ 479)', query: 'undertrial' },
    { label: 'Circumstantial Evidence (Panchsheel)', query: 'circumstantial' },
    { label: 'Electronic Records (65B ⇄ 63)', query: '65B' },
    { label: 'Custodial Torture (176 ⇄ 196)', query: 'custodial torture' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-border/50 bg-gradient-to-r from-amber-500/10 via-card/80 to-card/60 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Criminal Law Era Transition Hub
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Concordance crosswalk for IPC ↔ BNS, CrPC ↔ BNSS, and IEA ↔ BSA. Powered by InLegalBERT doctrine search & Section 8 General Clauses Act transposition.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Enacted 1 July 2024
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by section (e.g. 438, 41A, 302, 65B) or doctrine (e.g. custodial torture, preliminary inquiry, circumstantial)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/60 bg-background/80 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search Concordance'}
          </button>
        </form>

        {/* Quick Search Chips */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-muted-foreground">Quick Lookups:</span>
          {quickSearches.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(chip.query);
                doSearch(chip.query);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/40 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Category:</span>
          {[
            { id: 'ALL', label: 'All Provisions' },
            { id: 'PROCEDURAL', label: 'CrPC ⇄ BNSS (Procedural)' },
            { id: 'SUBSTANTIVE', label: 'IPC ⇄ BNS (Substantive)' },
            { id: 'EVIDENTIARY', label: 'IEA ⇄ BSA (Evidentiary)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === tab.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          Showing {filteredResults.length} matching statutory provisions
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-xl border border-border/40 bg-card/40 animate-pulse" />
          ))}
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-border/60 text-muted-foreground space-y-2">
          <Scale className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No statutory concordance matches found</p>
          <p className="text-xs">Try searching for another section number (e.g. 438, 482, 420) or conceptual doctrine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResults.map((pair) => {
            const isExpanded = expandedCards[pair.id] ?? false;
            const isCopied = copiedId === pair.id;

            return (
              <div
                key={pair.id}
                className="rounded-xl border border-border/60 bg-card/70 hover:border-border transition-all duration-200 p-5 space-y-4 shadow-sm"
              >
                {/* Top Section Bridge */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                    {pair.category}
                  </span>
                  {pair.similarity_score && (
                    <span className="text-[10px] text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">
                      InLegalBERT Match: {(pair.similarity_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Old <-> New Bridge Box */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/25 border border-border/40 items-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{pair.old_code}</span>
                    <div className="text-base font-bold text-amber-400">Section {pair.old_section}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{pair.old_title}</div>
                  </div>

                  <div className="space-y-0.5 text-right border-l border-border/40 pl-3">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{pair.new_code}</span>
                    <div className="text-base font-bold text-emerald-400">Section {pair.new_section}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{pair.new_title}</div>
                  </div>
                </div>

                {/* Doctrine & Summary */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-primary" />
                    {pair.concept_doctrine}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pair.doctrine_summary}
                  </p>
                </div>

                {/* Landmark Precedents */}
                {pair.landmark_precedents.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/30 space-y-1">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                      Governing Landmark Precedent:
                    </span>
                    <div className="text-xs font-medium text-foreground">
                      {pair.landmark_precedents[0].title}{' '}
                      <span className="text-muted-foreground font-mono font-normal">
                        [{pair.landmark_precedents[0].citation}]
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Row */}
                <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleExpand(pair.id)}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'Hide' : 'View'} Statutory Deltas & Warnings</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={() => handleCopyArgument(pair)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-colors"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy Court Pleading'}</span>
                  </button>
                </div>

                {/* Expandable Statutory Deltas */}
                {isExpanded && pair.statutory_deltas.length > 0 && (
                  <div className="pt-2 space-y-2 border-t border-border/30">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Statutory Variations in 2023 Enactment:
                    </span>
                    {pair.statutory_deltas.map((delta, dIdx) => (
                      <div key={dIdx} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-300">{delta.provision_name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {delta.delta_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{delta.details}</p>
                        <p className="text-amber-200/90 font-medium text-[11px]">
                          ⚠ Litigator Warning: {delta.litigator_warning}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
