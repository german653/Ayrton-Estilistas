import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { AgentToolExecutor } from './agent-tool-executor.service';
import { AGENT_TOOLS } from './agent.tools';

const MAX_TOOL_ITERATIONS = 5;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationsService,
    private readonly toolExecutor: AgentToolExecutor,
  ) {
    this.anthropic = new Anthropic({ apiKey: this.config.get<string>('ANTHROPIC_API_KEY') });
  }

  /**
   * Punto de entrada único usado por todos los canales (WhatsApp, Instagram,
   * Messenger, Web widget). Recibe el mensaje entrante, mantiene memoria de
   * conversación en Postgres, ejecuta el loop de tool-use y devuelve el
   * texto final para responder al cliente.
   */
  async handleIncomingMessage(params: {
    tenantId: string;
    channel: ChannelType;
    externalUserId: string;
    customerPhone?: string;
    text: string;
  }): Promise<{ reply: string; handedOff: boolean }> {
    const { tenantId, channel, externalUserId, text } = params;

    const agentConfig = await this.prisma.agentConfig.findUnique({ where: { tenantId } });
    if (!agentConfig || !agentConfig.isEnabled) {
      return { reply: 'Este negocio no tiene el asistente activo en este momento.', handedOff: false };
    }

    const customer = params.customerPhone
      ? await this.conversations.findOrCreateCustomerByPhone(tenantId, params.customerPhone)
      : await this.prisma.customer.create({ data: { tenantId } });

    const conversation = await this.conversations.findOrCreate(tenantId, channel, externalUserId, customer.id);

    if (conversation.handedOffToHuman) {
      await this.conversations.appendMessage(conversation.id, 'USER', text);
      return { reply: '', handedOff: true };
    }

    await this.conversations.appendMessage(conversation.id, 'USER', text);
    const history = await this.conversations.getHistory(conversation.id, 20);

    const messages: Anthropic.MessageParam[] = history.map((m) => ({
      role: m.role === 'ASSISTANT' ? 'assistant' : 'user',
      content: m.content,
    }));

    const finalText = await this.runToolLoop(agentConfig, messages, {
      tenantId,
      customerId: customer.id,
      conversationId: conversation.id,
    });

    await this.conversations.appendMessage(conversation.id, 'ASSISTANT', finalText);

    const refreshed = await this.prisma.conversation.findUnique({ where: { id: conversation.id } });
    return { reply: finalText, handedOff: !!refreshed?.handedOffToHuman };
  }

  private async runToolLoop(
    agentConfig: { systemPrompt: string; model: string; temperature: number },
    initialMessages: Anthropic.MessageParam[],
    ctx: { tenantId: string; customerId: string; conversationId: string },
  ): Promise<string> {
    const messages = [...initialMessages];

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await this.anthropic.messages.create({
        model: mapModel(agentConfig.model),
        max_tokens: 1024,
        system: `${agentConfig.systemPrompt}\n\n---\nDato de contexto (no lo repitas literalmente al cliente salvo que lo pregunte): la fecha y hora actual es ${currentDateTimeForPrompt()}, zona horaria de Argentina. Usá esta fecha como referencia real para calcular "hoy", "mañana", "el viernes que viene", etc. al llamar a las herramientas — nunca asumas una fecha distinta.`,
        tools: AGENT_TOOLS,
        messages,
      });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (toolUseBlocks.length === 0) {
        const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
        return textBlock?.text ?? 'Disculpá, no pude procesar tu consulta. ¿Podés reformularla?';
      }

      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await this.toolExecutor.execute(toolUse.name, toolUse.input as Record<string, any>, ctx);
        toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result });
      }
      messages.push({ role: 'user', content: toolResults });
    }

    this.logger.warn(`Se alcanzó el límite de iteraciones de tool-use (conversación ${ctx.conversationId})`);
    return 'Estoy teniendo dificultades para resolver esto. Te voy a derivar con una persona del equipo.';
  }
}

function mapModel(configured: string): string {
  const map: Record<string, string> = {
    'claude-sonnet-5': 'claude-sonnet-5',
    'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
    'claude-opus-4-8': 'claude-opus-4-8',
  };
  return map[configured] ?? 'claude-sonnet-5';
}

function currentDateTimeForPrompt(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Argentina/Cordoba',
  });
  const timeStr = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Cordoba',
  });
  const isoDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Cordoba' }); // YYYY-MM-DD
  return `${dateStr}, ${timeStr} hs (formato de fecha para las herramientas: ${isoDate})`;
}
