import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsAppApiClient {
  private readonly logger = new Logger(WhatsAppApiClient.name);
  private readonly graphVersion = 'v20.0';

  async sendTextMessage(phoneNumberId: string, accessToken: string, to: string, text: string) {
    const url = `https://graph.facebook.com/${this.graphVersion}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Error enviando WhatsApp a ${to}: ${response.status} ${errorBody}`);
    }
    return response.ok;
  }
}
