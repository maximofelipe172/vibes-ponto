/**
 * Seed: define quais e-mails têm papel de administrador.
 *
 * Os colaboradores criam a própria conta pela tela "Criar conta" (e
 * entram como `employee`). Este script pré-cadastra os perfis de
 * administradores: ao criarem a conta com o mesmo e-mail, o perfil é
 * reaproveitado e o papel de admin é preservado.
 *
 * Também promove alguém a admin depois: adicione o e-mail abaixo e rode
 * de novo (o script é idempotente). Alternativa sem código: use a tela
 * "Gerenciar Usuários".
 *
 * Requer no .env: DATABASE_URL e DIRECT_URL.
 *
 * Executar: npm run db:seed
 */
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedUser {
  nome: string;
  email: string;
  role: Role;
}

// ─── ADMINISTRADORES ─────────────────────────────────────────────────────
const seedUsers: SeedUser[] = [
  {
    nome: "Felipe Molina",
    email: "felipe.molina@minhavibes.com.br",
    role: Role.admin,
  },
  {
    nome: "Admin Vibes",
    email: "vibesadm2025@gmail.com",
    role: Role.admin,
  },
];

async function main() {
  for (const user of seedUsers) {
    const email = user.email.toLowerCase();
    await prisma.profile.upsert({
      where: { email },
      update: { role: user.role },
      create: { nome: user.nome, email, role: user.role },
    });
    console.log(`✔ ${user.role.padEnd(8)} ${email}`);
  }
  console.log(
    "\nSeed concluído. Estes e-mails entram como administradores ao criar a conta."
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
