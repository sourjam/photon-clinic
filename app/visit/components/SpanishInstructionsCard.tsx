"use client";

import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";

type SpanishInstructionsCardProps = {
  isIdle: boolean;
  isLoading: boolean;
  isAiError: boolean;
  hasInstructions: boolean;
  reviewed: boolean;
  onRegenerate: () => void;
  onCopy: () => void;
};

type BadgeTone = "neutral" | "info" | "success" | "warn" | "error";
type BadgeConfig = { label: string; tone: BadgeTone };

function getBadge(isLoading: boolean, isAiError: boolean, hasInstructions: boolean, reviewed: boolean): BadgeConfig {
  if (isLoading) return { label: "Generating…", tone: "info" };
  if (isAiError) return { label: "Failed", tone: "error" };
  if (hasInstructions && reviewed) return { label: "AI generated · reviewed", tone: "success" };
  if (hasInstructions) return { label: "AI generated · needs review", tone: "warn" };
  return { label: "Not generated", tone: "neutral" };
}

function EmptyState() {
  return (
    <div className="px-4 py-[26px] text-center text-[12.5px] text-muted-3">
      Instructions appear here once generated from the clinician note.
    </div>
  );
}

function Skeleton() {
  return (
    <div className="px-[14px] py-4">
      <div aria-hidden="true" className="flex flex-col gap-[9px]">
        <div className="h-[11px] w-[82%] rounded-[4px] bg-surface-skeleton animate-pulse-soft" />
        <div className="h-[11px] w-[94%] rounded-[4px] bg-surface-skeleton animate-pulse-soft [animation-delay:.15s]" />
        <div className="h-[11px] w-[71%] rounded-[4px] bg-surface-skeleton animate-pulse-soft [animation-delay:.3s]" />
      </div>
      <div className="mt-3 text-[11.5px] text-muted-2" role="status">
        Generating patient-friendly Spanish from the clinician note…
      </div>
    </div>
  );
}

function Content({ onCopy, onRegenerate }: Pick<SpanishInstructionsCardProps, "onCopy" | "onRegenerate">) {
  return (
    <div className="flex flex-col gap-[11px] p-[14px]">
      <div className="rounded-[8px] border border-brand-line-2 bg-brand-bg-2 px-[15px] py-[14px]" lang="es">
        <h2 className="mb-2 text-[13px] font-bold text-brand-ink">Crema de hidrocortisona 2.5% — cómo usarla</h2>
        <div className="flex flex-col gap-2 text-[13px] leading-[1.65] text-ink-2">
          <p>
            Lo que vemos parece un brote de eczema en los antebrazos. La piel está irritada, pero se controla bien
            con cuidado diario.
          </p>
          <p>
            Aplique una capa fina de la crema en las zonas afectadas{" "}
            <strong>dos veces al día, por 7 días</strong>. Luego deténgase. No la use en la cara ni cerca de los ojos.
          </p>
          <p>Use jabón y crema humectante sin fragancia todos los días, incluso cuando la piel esté mejor.</p>
          <p className="rounded-[0_6px_6px_0] border-l-[3px] border-warn bg-warn-bg px-[11px] py-[9px] text-warn-ink-4">
            Sobre la lactancia: este tipo de crema se usa habitualmente durante la lactancia, pero{" "}
            <strong>su médico debe confirmarlo con usted antes de empezar</strong>. No la aplique en el pecho.
          </p>
          <p>Llame a la clínica si la piel empeora, aparece pus o fiebre, o si no mejora en 2 semanas.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-[9px]">
        <span className="text-[11px] text-muted-2">Reading level: plain Spanish · tone: respectful</span>
        <div className="flex-1" />
        <Button onClick={onRegenerate} size="sm" variant="ghost">
          Regenerate
        </Button>
        <Button onClick={onCopy} size="sm" variant="ghost">
          Copy
        </Button>
      </div>
    </div>
  );
}

export function SpanishInstructionsCard({
  isIdle,
  isLoading,
  isAiError,
  hasInstructions,
  reviewed,
  onRegenerate,
  onCopy,
}: SpanishInstructionsCardProps) {
  const badge = getBadge(isLoading, isAiError, hasInstructions, reviewed);

  return (
    <Card>
      <CardHeader title="Spanish patient instructions">
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </CardHeader>

      {isIdle ? <EmptyState /> : null}
      {isLoading ? <Skeleton /> : null}
      {hasInstructions ? <Content onCopy={onCopy} onRegenerate={onRegenerate} /> : null}
    </Card>
  );
}
