import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TimeRecordRow } from "@/types";

interface RecordsTableProps {
  records: TimeRecordRow[];
  /** Exibe o colaborador (visões administrativas). */
  showCollaborator?: boolean;
  emptyMessage?: string;
}

function EmAndamento() {
  return <Badge variant="warning">Em andamento</Badge>;
}

/**
 * Registros de ponto.
 *
 * No celular vira uma lista de cards (tabela de 5 colunas não cabe em
 * 375px sem rolagem horizontal); a partir de `md` volta a ser tabela.
 */
export function RecordsTable({
  records,
  showCollaborator = false,
  emptyMessage = "Nenhum registro encontrado.",
}: RecordsTableProps) {
  if (records.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      {/* ── Celular: cards ─────────────────────────────────────────── */}
      <ul className="flex flex-col gap-3 md:hidden">
        {records.map((record) => (
          <li
            key={record.id}
            className="flex flex-col gap-3 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                {showCollaborator && (
                  <p className="truncate font-medium">{record.colaborador}</p>
                )}
                <p
                  className={
                    showCollaborator
                      ? "text-xs text-muted-foreground"
                      : "font-medium"
                  }
                >
                  {record.data}
                </p>
              </div>
              {record.saida === "—" && <EmAndamento />}
            </div>

            <dl className="grid grid-cols-3 gap-2 text-sm">
              {[
                { label: "Entrada", value: record.entrada },
                { label: "Saída", value: record.saida },
                { label: "Total", value: record.total },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="font-medium tabular-nums">{item.value}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* ── Desktop: tabela ────────────────────────────────────────── */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {showCollaborator && <TableHead>Colaborador</TableHead>}
              <TableHead>Data</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Saída</TableHead>
              <TableHead>Total de Horas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                {showCollaborator && (
                  <TableCell className="font-medium">
                    {record.colaborador}
                  </TableCell>
                )}
                <TableCell>{record.data}</TableCell>
                <TableCell className="tabular-nums">{record.entrada}</TableCell>
                <TableCell className="tabular-nums">
                  {record.saida === "—" ? <EmAndamento /> : record.saida}
                </TableCell>
                <TableCell className="tabular-nums">{record.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
