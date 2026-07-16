"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Shield,
  UserPlus,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ROLE_BADGE_VARIANT, ROLE_LABELS } from "@/lib/rbac/permissions";
import type { StatCardData } from "@/types";

const ICONS: Record<StatCardData["icon"], LucideIcon> = {
  Users,
  Shield,
  CheckCircle2,
  UserX,
  UserPlus,
};

/**
 * Cards de indicadores. Cada card abre a lista das pessoas que ele
 * conta — o número deixa de ser um beco sem saída.
 */
export function StatsCards({ cards }: { cards: StatCardData[] }) {
  const [aberto, setAberto] = useState<StatCardData | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const Icon = ICONS[card.icon];
          const vazio = card.pessoas.length === 0;

          return (
            <Card
              key={card.key}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => !vazio && setAberto(card)}
                  disabled={vazio}
                  aria-label={`Ver ${card.label.toLowerCase()}`}
                  className="flex w-full items-start justify-between rounded-xl p-6 text-left transition-colors enabled:hover:bg-accent/50 disabled:cursor-default"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-semibold tabular-nums tracking-tight">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vazio ? card.description : "Clique para ver quem"}
                    </p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="size-4.5 text-muted-foreground" />
                  </span>
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={!!aberto}
        onOpenChange={(open) => !open && setAberto(null)}
        title={aberto?.label ?? ""}
        description={aberto?.description}
      >
        <ul className="flex max-h-96 flex-col gap-3 overflow-y-auto">
          {aberto?.pessoas.map((pessoa) => (
            <li
              key={pessoa.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{pessoa.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {pessoa.email}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {pessoa.detalhe && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {pessoa.detalhe}
                  </span>
                )}
                <Badge variant={ROLE_BADGE_VARIANT[pessoa.role]}>
                  {ROLE_LABELS[pessoa.role]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
