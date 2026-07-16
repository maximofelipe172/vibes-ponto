/** Mensagem de erro do servidor exibida no topo dos formulários de auth. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="animate-fade-in-up rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
    >
      {message}
    </p>
  );
}
