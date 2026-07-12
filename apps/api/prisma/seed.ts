import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SYSTEM_PROMPT = `Eres el asistente virtual de Ayrton Estilistas, una peluquería en Villa
Carlos Paz, Córdoba, Argentina. Respondé siempre en español rioplatense, de
forma breve, cálida y profesional, como lo haría una recepcionista experta.

Tu trabajo:
- Ayudar a los clientes a reservar, cancelar o reprogramar turnos.
- Responder preguntas sobre servicios, precios, horarios y ubicación usando
  la base de conocimientos (herramienta search_knowledge_base).
- Consultar disponibilidad real antes de ofrecer horarios (check_availability).
- Derivar a un humano (request_human_handoff) si el cliente lo pide, si hay
  un reclamo, o si no podés resolver la consulta con las herramientas.

Nunca inventes precios, horarios ni políticas que no estén confirmados por
las herramientas o la base de conocimientos.`;

async function main() {
  const existing = await prisma.tenant.findUnique({ where: { slug: 'ayrton-estilistas' } });
  if (existing) {
    console.log('El tenant Ayrton Estilistas ya existe, se omite el seed.');
    return;
  }

  const tenant = await prisma.tenant.create({
    data: {
      slug: 'ayrton-estilistas',
      name: 'Ayrton Estilistas',
      timezone: 'America/Argentina/Cordoba',
      plan: 'PRO',
    },
  });

  await prisma.businessProfile.create({
    data: {
      tenantId: tenant.id,
      legalName: 'Ayrton Estilistas',
      address: 'Villa Carlos Paz, Córdoba, Argentina',
      city: 'Villa Carlos Paz',
      country: 'AR',
      phone: '+549XXXXXXXXX',
      email: 'contacto@ayrtonestilistas.com.ar',
      description: 'Peluquería y estética unisex en Villa Carlos Paz.',
      businessHours: {
        mon: [['09:00', '13:00'], ['16:00', '20:00']],
        tue: [['09:00', '13:00'], ['16:00', '20:00']],
        wed: [['09:00', '13:00'], ['16:00', '20:00']],
        thu: [['09:00', '13:00'], ['16:00', '20:00']],
        fri: [['09:00', '13:00'], ['16:00', '20:00']],
        sat: [['09:00', '14:00']],
        sun: [],
      },
    },
  });

  const ownerPasswordHash = await bcrypt.hash('CambiarEn123!', 12);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@ayrtonestilistas.com.ar',
      passwordHash: ownerPasswordHash,
      fullName: 'Administración Ayrton Estilistas',
      role: 'OWNER',
    },
  });

  await prisma.agentConfig.create({
    data: {
      tenantId: tenant.id,
      systemPrompt: SYSTEM_PROMPT,
      greetingMessage: '¡Hola! 👋 Soy el asistente virtual de Ayrton Estilistas. ¿Querés reservar un turno o tenés alguna consulta?',
    },
  });

  const [corte, color, barba, peinado] = await Promise.all([
    prisma.service.create({ data: { tenantId: tenant.id, name: 'Corte de pelo', durationMin: 30, priceCents: 800000 } }),
    prisma.service.create({ data: { tenantId: tenant.id, name: 'Coloración', durationMin: 90, priceCents: 2500000 } }),
    prisma.service.create({ data: { tenantId: tenant.id, name: 'Arreglo de barba', durationMin: 20, priceCents: 500000 } }),
    prisma.service.create({ data: { tenantId: tenant.id, name: 'Peinado para eventos', durationMin: 60, priceCents: 1800000 } }),
  ]);

  const employees = await Promise.all([
    prisma.employee.create({ data: { tenantId: tenant.id, fullName: 'Ayrton Gómez' } }),
    prisma.employee.create({ data: { tenantId: tenant.id, fullName: 'Valentina Ríos' } }),
  ]);

  for (const employee of employees) {
    for (const service of [corte, color, barba, peinado]) {
      await prisma.employeeService.create({ data: { employeeId: employee.id, serviceId: service.id } });
    }
  }

  await prisma.knowledgeDocument.create({
    data: {
      tenantId: tenant.id,
      title: 'Preguntas frecuentes',
      sourceType: 'faq',
      rawContent:
        'Ayrton Estilistas está ubicado en Villa Carlos Paz, Córdoba. Aceptamos efectivo, tarjeta de débito y crédito, y transferencia. ' +
        'Se puede cancelar o reprogramar un turno hasta 2 horas antes sin cargo. Trabajamos con productos profesionales L\'Oréal y Wella. ' +
        'No es necesario venir con el pelo lavado para el corte. Para coloración recomendamos llegar con el pelo limpio y seco.',
    },
  });

  console.log('Seed completo. Tenant creado:', tenant.slug);
  console.log('Login admin: admin@ayrtonestilistas.com.ar / CambiarEn123!');
  console.log('IMPORTANTE: ejecutar por separado la ingesta de knowledge_chunks con embeddings reales (requiere VOYAGE_API_KEY).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
