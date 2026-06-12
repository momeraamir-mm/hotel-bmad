"use client";

import { Check } from "lucide-react";

export type FlowStep = { id: string; label: string; done: boolean };

/**
 * Sticky tab bar across the top of the workflow. Shows the pipeline stages, marks
 * completed ones, and switches which stage is visible. The panels themselves stay
 * mounted (hidden, not unmounted) so the live supplier simulation and in-progress
 * edits survive a tab switch.
 */
export function FlowStepper({
  steps,
  active,
  onSelect,
}: {
  steps: FlowStep[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="sticky top-0 z-30 -mx-4 border-b border-sand bg-cream/85 px-4 py-2.5 backdrop-blur no-print">
      <ol className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto text-sm">
        {steps.map((s, i) => {
          const isActive = active === s.id;
          return (
            <li key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => onSelect(s.id)}
                aria-current={isActive ? "step" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition ${
                  isActive
                    ? "bg-brand text-white shadow-sm"
                    : s.done
                      ? "text-brand-dark hover:bg-brand/10"
                      : "text-ink/50 hover:bg-sand"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : s.done
                        ? "bg-brand/15 text-brand-dark"
                        : "bg-sand text-ink/50"
                  }`}
                >
                  {s.done && !isActive ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && <span className="h-px w-3 shrink-0 bg-sand sm:w-6" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
