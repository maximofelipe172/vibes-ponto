import { z } from "zod";

/** Mínimo de caracteres exigido na senha. */
export const MIN_PASSWORD_LENGTH = 8;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Informe o e-mail")
  .email("E-mail inválido");

const passwordField = z
  .string()
  .min(1, "Informe a senha")
  .min(MIN_PASSWORD_LENGTH, `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`);

const nomeField = z
  .string()
  .trim()
  .min(1, "Informe o nome completo")
  .min(3, "Nome muito curto");

const roleField = z.enum(["admin", "employee"], {
  errorMap: () => ({ message: "Tipo de usuário inválido" }),
});

const statusField = z.enum(["active", "inactive"], {
  errorMap: () => ({ message: "Status inválido" }),
});

// ── Autenticação ────────────────────────────────────────────────────────

export const signUpSchema = z
  .object({
    nome: nomeField,
    email: emailField,
    senha: passwordField,
    confirmarSenha: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export const signInSchema = z.object({
  email: emailField,
  senha: z.string().min(1, "Informe a senha"),
  lembrarMe: z.boolean().optional().default(true),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    senha: passwordField,
    confirmarSenha: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

// ── Perfil próprio ──────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  nome: nomeField,
  cargo: z.string().trim().max(60, "Cargo muito longo").optional(),
  departamento: z.string().trim().max(60, "Departamento muito longo").optional(),
});

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: passwordField,
    confirmarSenha: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

// ── Gestão de usuários (admin) ──────────────────────────────────────────

export const createUserSchema = z.object({
  nome: nomeField,
  email: emailField,
  senha: passwordField,
  cargo: z.string().trim().max(60).optional(),
  departamento: z.string().trim().max(60).optional(),
  role: roleField,
  status: statusField,
});

export const updateUserSchema = z.object({
  nome: nomeField,
  cargo: z.string().trim().max(60).optional(),
  departamento: z.string().trim().max(60).optional(),
  role: roleField,
  status: statusField,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
