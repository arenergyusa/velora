import { prisma } from './src/lib/prisma';
async function main() {
  const user = await prisma.user.findUnique({ 
    where: { id: 'be2d2108-17f7-42a5-bce7-f87908d8dd15' }, 
    include: { cycles: true } 
  });
  console.log(JSON.stringify(user, null, 2));
}
main().finally(() => prisma.$disconnect());
