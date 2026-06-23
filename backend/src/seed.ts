import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@timetrack.com' },
    update: {},
    create: {
      email: 'admin@timetrack.com',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // Create default workspace
  const workspace = await prisma.workspace.upsert({
    where: { joinCode: 'DEMO1234' },
    update: {},
    create: {
      name: 'Demo Workspace',
      description: 'Default workspace for demonstration',
      joinCode: 'DEMO1234',
    },
  });

  // Link admin to workspace
  await prisma.userWorkspace.upsert({
    where: { userId_workspaceId: { userId: admin.id, workspaceId: workspace.id } },
    update: {},
    create: { userId: admin.id, workspaceId: workspace.id, role: 'ADMIN' },
  });

  // Create sample projects
  const projects = ['Website Redesign', 'Mobile App', 'Marketing Campaign'];
  const colors = ['#6366f1', '#10b981', '#f59e0b'];

  for (let i = 0; i < projects.length; i++) {
    const project = await prisma.project.upsert({
      where: { id: `proj-${i + 1}` },
      update: {},
      create: {
        id: `proj-${i + 1}`,
        name: projects[i],
        color: colors[i],
        workspaceId: workspace.id,
      },
    });

    await prisma.task.createMany({
      data: [
        { name: 'Planning', projectId: project.id },
        { name: 'Development', projectId: project.id },
        { name: 'Review', projectId: project.id },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅ Seed complete!');
  console.log('📧 Admin login: admin@timetrack.com');
  console.log('🔑 Admin password: Admin@123');
  console.log('🏢 Workspace join code: DEMO1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
