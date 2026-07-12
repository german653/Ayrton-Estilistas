import Anthropic from '@anthropic-ai/sdk';

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_availability',
    description:
      'Consulta los horarios disponibles para un servicio en una fecha específica. Usar SIEMPRE antes de ofrecer horarios concretos al cliente.',
    input_schema: {
      type: 'object',
      properties: {
        service_name: { type: 'string', description: 'Nombre del servicio, ej: "Corte de pelo"' },
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        employee_name: { type: 'string', description: 'Nombre del empleado preferido (opcional)' },
      },
      required: ['service_name', 'date'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Confirma y crea una reserva de turno. Usar solo después de que el cliente eligió un horario concreto.',
    input_schema: {
      type: 'object',
      properties: {
        service_name: { type: 'string' },
        employee_name: { type: 'string' },
        starts_at: { type: 'string', description: 'Fecha y hora ISO 8601 exacta del turno elegido' },
        customer_full_name: { type: 'string' },
      },
      required: ['service_name', 'employee_name', 'starts_at', 'customer_full_name'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancela el próximo turno confirmado del cliente.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'reschedule_appointment',
    description: 'Reprograma el próximo turno confirmado del cliente a un nuevo horario.',
    input_schema: {
      type: 'object',
      properties: {
        new_starts_at: { type: 'string', description: 'Nueva fecha y hora ISO 8601' },
      },
      required: ['new_starts_at'],
    },
  },
  {
    name: 'search_knowledge_base',
    description:
      'Busca información en la base de conocimientos del negocio (precios, políticas, preguntas frecuentes, dirección, etc).',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'request_human_handoff',
    description: 'Deriva la conversación a un humano cuando el agente no puede resolver la consulta o el cliente lo pide explícitamente.',
    input_schema: {
      type: 'object',
      properties: { reason: { type: 'string' } },
      required: ['reason'],
    },
  },
];
