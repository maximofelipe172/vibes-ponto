"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { NavItem } from "@/lib/rbac/navigation";

/** Menu lateral em telas pequenas: abre como painel sobreposto. */
export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // O portal só existe no client.
  useEffect(() => setMounted(true), []);

  // Fecha ao trocar de rota.
  useEffect(() => setOpen(false), [pathname]);

  // Fecha no Esc e trava o scroll do fundo enquanto aberto.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const overlay = (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in-up"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className="absolute inset-y-0 left-0 flex w-64 flex-col gap-4 border-r bg-background p-4 shadow-xl animate-fade-in-up"
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <SidebarNav items={items} onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      {/*
        Portal para o <body>: o header usa `backdrop-blur`, e
        `backdrop-filter` cria um containing block para descendentes
        `position: fixed` — sem o portal, o overlay se ancoraria no
        header (56px de altura) em vez da viewport, e o painel ficaria
        com o fundo cortado, parecendo transparente.
      */}
      {mounted && open && createPortal(overlay, document.body)}
    </>
  );
}
