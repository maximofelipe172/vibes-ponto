"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface FilterSelect {
  /** Nome do parâmetro na URL. */
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

interface SearchFiltersProps {
  searchPlaceholder: string;
  /** Selects extras (ex.: tipo, status). */
  selects?: FilterSelect[];
}

/**
 * Barra de pesquisa + filtros refletidos na URL, reutilizada nas telas
 * de usuários e do painel admin. A busca tem debounce; os selects
 * aplicam na hora. Demais parâmetros da URL (ex.: período) são
 * preservados.
 */
export function SearchFilters({
  searchPlaceholder,
  selects = [],
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function applyParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyParams({ q: value }), 350);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasFilters =
    !!searchParams.get("q") ||
    selects.some((select) => !!searchParams.get(select.name));

  function clearAll() {
    setQuery("");
    const cleared: Record<string, string> = { q: "" };
    selects.forEach((select) => (cleared[select.name] = ""));
    applyParams(cleared);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-48 flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
          aria-label={searchPlaceholder}
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {selects.map((select) => (
        <Select
          key={select.name}
          aria-label={select.label}
          className="sm:w-40"
          value={searchParams.get(select.name) ?? ""}
          onChange={(e) => applyParams({ [select.name]: e.target.value })}
        >
          <option value="">{select.label}: todos</option>
          {select.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ))}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X />
          Limpar
        </Button>
      )}
    </div>
  );
}
