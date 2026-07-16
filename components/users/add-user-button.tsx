"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserFormDialog } from "@/components/users/user-form-dialog";

export function AddUserButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus />
        Adicionar usuário
      </Button>
      <UserFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
