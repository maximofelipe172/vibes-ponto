import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export interface StatCard {
  key: string;
  label: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
}

/** Grade de cards de métricas, reutilizável em qualquer painel. */
export function StatsCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ key, label, value, description, icon: Icon }, index) => (
        <Card
          key={key}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="flex items-start justify-between p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                {value}
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
              <Icon className="size-4.5 text-muted-foreground" />
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
