"use client";

import type { MEDICATION } from "../demoData";
import type { TreatmentSearchStatus, VisitTreatment } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";
import { FieldLabel } from "./ui/FieldLabel";

export type TreatmentIdState = "awaiting" | "failed" | "resolved";

type MedicationPrepCardProps = {
  medication: typeof MEDICATION;
  selectedTreatment: VisitTreatment;
  searchQuery: string;
  searchResults: VisitTreatment[];
  searchStatus: TreatmentSearchStatus;
  treatmentStale: boolean;
  treatmentIdState: TreatmentIdState;
  treatmentId: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  onQuickTerm: (term: string) => void;
  onSelectTreatment: (id: string) => void;
};

const treatmentIdChipClasses: Record<TreatmentIdState, string> = {
  awaiting: "bg-surface-muted text-muted-2",
  failed: "bg-err-bg text-err-ink",
  resolved: "bg-brand-bg-3 text-brand-ink",
};

const unresolvedTreatmentIdLabels: Record<Exclude<TreatmentIdState, "resolved">, string> = {
  awaiting: "awaiting lookup",
  failed: "lookup failed",
};

const quickTerms = ["hydrocortisone", "triamcinolone", "mupirocin", "lisinopril", "ondansetron"];

export function MedicationPrepCard({
  medication,
  selectedTreatment,
  searchQuery,
  searchResults,
  searchStatus,
  treatmentStale,
  treatmentIdState,
  treatmentId,
  onSearchQueryChange,
  onSearch,
  onQuickTerm,
  onSelectTreatment,
}: MedicationPrepCardProps) {
  const chipLabel =
    treatmentIdState === "resolved" ? treatmentId : unresolvedTreatmentIdLabels[treatmentIdState];
  const hasResults = searchStatus === "ready" && searchResults.length > 0;
  const hasNoResults = searchStatus === "ready" && searchResults.length === 0;

  return (
    <Card>
      <CardHeader title="Medication prep" meta="Photon catalog lookup · no prescribing" />
      <div className="border-b border-line-soft px-[14px] py-3">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <label className="sr-only" htmlFor="treatment-query">
            Search Photon treatment catalog
          </label>
          <div className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-[7px] border border-line-input bg-surface-sunken px-[11px] focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
            <span aria-hidden="true" className="text-[12px] text-muted-3">
              ⌕
            </span>
            <input
              className="w-full border-none bg-transparent text-[12.5px] text-ink-2 outline-none"
              id="treatment-query"
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="hydrocortisone, mupirocin, ondansetron…"
              value={searchQuery}
            />
          </div>
          <Button className="h-9" size="sm" type="submit">
            {searchStatus === "loading" ? "Searching…" : "Search catalog"}
          </Button>
        </form>

        <div className="mt-[9px] flex flex-wrap items-center gap-[6px]">
          <span className="text-[11px] text-muted-2">Try:</span>
          {quickTerms.map((term) => (
            <button
              className="rounded-[12px] border border-line-2 bg-surface-muted px-[9px] py-1 text-[11px] font-medium text-ink-5"
              key={term}
              onClick={() => onQuickTerm(term)}
              type="button"
            >
              {term}
            </button>
          ))}
        </div>

        <div className="mt-[10px] rounded-[8px] border border-ok-line-2 bg-ok-bg-2 px-[13px] py-3">
          <div className="flex items-start justify-between gap-[10px]">
            <div className="min-w-0">
              <div className="mb-[3px] text-[10px] font-semibold uppercase tracking-[.06em] text-ok-ink">
                Active treatment
              </div>
              <div className="text-[13.5px] font-bold leading-[1.35] text-ink">{selectedTreatment.name}</div>
              <div className="mt-[6px] flex flex-wrap items-center gap-[7px]">
                <span className="rounded-[5px] bg-brand-bg-3 px-2 py-[3px] font-mono text-[10.5px] text-brand-ink">
                  {selectedTreatment.id}
                </span>
                {selectedTreatment.form ? <span className="text-[11px] text-muted">{selectedTreatment.form}</span> : null}
              </div>
            </div>
            <Badge tone="success">Treatment selected</Badge>
          </div>
          {treatmentStale ? (
            <div className="mt-[9px] rounded-[6px] border border-warn-line bg-warn-bg px-[10px] py-[7px] text-[11.5px] font-medium text-warn-ink">
              Treatment changed · regenerate instructions before handoff
            </div>
          ) : null}
        </div>

        {searchStatus === "error" ? (
          <div className="mt-[10px] rounded-[7px] border border-err-line bg-err-bg px-[11px] py-[9px] text-[11.5px] text-err-ink">
            Treatment search failed. Retry the catalog lookup.
          </div>
        ) : null}

        {hasResults ? (
          <div className="mt-[10px]">
            <div className="mb-[7px] flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[.06em] text-muted-3">
                {searchResults.length} catalog {searchResults.length === 1 ? "match" : "matches"}
              </span>
              <span className="font-mono text-[10px] text-muted-4">GET /catalog/treatments</span>
            </div>
            <div className="overflow-hidden rounded-[7px] border border-line-soft">
              {searchResults.map((result) => {
                const selected = result.id === selectedTreatment.id;
                return (
                  <div
                    className={[
                      "flex items-center gap-[10px] border-b border-line-row-2 px-[11px] py-[9px] last:border-b-0",
                      selected ? "bg-brand-bg-2" : "bg-surface",
                    ].join(" ")}
                    key={result.id}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold leading-[1.35] text-ink">{result.name}</div>
                      <div className="mt-[3px] flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-muted">{result.id}</span>
                        {result.form ? <span className="text-[10.5px] text-muted-2">{result.form}</span> : null}
                      </div>
                    </div>
                    <Button
                      aria-label={`${selected ? "Selected" : "Select"} ${result.name}`}
                      dimmed={selected}
                      onClick={() => onSelectTreatment(result.id)}
                      size="sm"
                      variant="ghost"
                    >
                      {selected ? "Selected" : "Select"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {hasNoResults ? (
          <div className="mt-[10px] rounded-[7px] border border-dashed border-line-2 bg-surface-sunken px-[11px] py-[10px] text-[11.5px] text-muted-2">
            No catalog matches. Try another treatment name.
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-[14px] py-[13px]">
        <div className="col-span-2">
          <FieldLabel>Medication</FieldLabel>
          <div className="flex flex-wrap items-center gap-[9px]">
            <span className="text-[13.5px] font-bold text-ink">{selectedTreatment.name}</span>
            <span
              className={[
                "rounded-[5px] px-2 py-[3px] font-mono text-[10.5px]",
                treatmentIdChipClasses[treatmentIdState],
              ].join(" ")}
            >
              {chipLabel}
            </span>
          </div>
        </div>

        <div className="col-span-2">
          <FieldLabel>Directions</FieldLabel>
          <div className="text-[12.5px] font-medium leading-[1.5] text-ink">{medication.directions}</div>
        </div>

        <div>
          <FieldLabel>Quantity</FieldLabel>
          <div className="text-[12.5px] font-semibold text-ink">{medication.quantity}</div>
        </div>

        <div>
          <FieldLabel>Refills</FieldLabel>
          <div className="text-[12.5px] font-semibold text-ink">{medication.refills}</div>
        </div>

        <div className="col-span-2">
          <FieldLabel>Notes to pharmacist</FieldLabel>
          <div className="text-[12.5px] leading-[1.5] text-ink-3">{medication.pharmacistNotes}</div>
        </div>
      </div>
    </Card>
  );
}
