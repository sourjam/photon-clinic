"use client";

import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

type ClinicianReviewCardProps = {
  canReview: boolean;
  reviewed: boolean;
  onToggleReviewed: () => void;
  reviewerName: string;
  reviewerTime: string;
};

type ReviewState = {
  cardTone: "plain" | "warn" | "ok";
  icon: string;
  iconClassName: string;
  title: string;
  titleClassName: string;
  body: string;
  buttonLabel?: string;
  buttonVariant?: "primary" | "successGhost";
};

function getReviewState(
  canReview: boolean,
  reviewed: boolean,
  reviewerName: string,
  reviewerTime: string,
): ReviewState {
  if (!canReview) {
    return {
      cardTone: "plain",
      icon: "–",
      iconClassName: "bg-line-strongest",
      title: "Clinician review pending",
      titleClassName: "text-ink-6",
      body: "Generate the Spanish instructions before reviewing.",
    };
  }

  if (!reviewed) {
    return {
      cardTone: "warn",
      icon: "!",
      iconClassName: "bg-warn",
      title: "Clinician review required",
      titleClassName: "text-warn-ink",
      body:
        "AI output is not patient-ready until you confirm the wording, the lactation guidance and the medication prep.",
      buttonLabel: "Mark reviewed",
      buttonVariant: "primary",
    };
  }

  return {
    cardTone: "ok",
    icon: "✓",
    iconClassName: "bg-ok",
    title: "Reviewed by clinician",
    titleClassName: "text-ok-ink",
    body: `${reviewerName} confirmed the Spanish instructions, medication prep and safety checks at ${reviewerTime}.`,
    buttonLabel: "Reviewed ✓",
    buttonVariant: "successGhost",
  };
}

export function ClinicianReviewCard({
  canReview,
  reviewed,
  onToggleReviewed,
  reviewerName,
  reviewerTime,
}: ClinicianReviewCardProps) {
  const reviewState = getReviewState(canReview, reviewed, reviewerName, reviewerTime);

  return (
    <Card className="px-[14px] py-[13px]" tone={reviewState.cardTone}>
      <div className="flex items-start gap-[11px]">
        <div
          aria-hidden="true"
          className={[
            "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
            reviewState.iconClassName,
          ].join(" ")}
        >
          {reviewState.icon}
        </div>
        <div className="flex-1">
          <div className={["text-[12.5px] font-bold", reviewState.titleClassName].join(" ")}>
            {reviewState.title}
          </div>
          <div className="mt-[3px] text-[12px] leading-[1.5] text-ink-6">{reviewState.body}</div>
        </div>
        {canReview && reviewState.buttonLabel && reviewState.buttonVariant ? (
          <Button
            className="focus-visible:ring-2 focus-visible:ring-brand/30"
            onClick={onToggleReviewed}
            size="sm"
            variant={reviewState.buttonVariant}
          >
            {reviewState.buttonLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
