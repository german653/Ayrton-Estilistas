import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MetaGraphClient {
  private readonly logger = new Logger(MetaGraphClient.name);
  private readonly graphVersion = 'v20.0';

  /** Sirve tanto para Messenger como para Instagram DM: ambos usan /me/messages con page access token. */
  async sendMessage(pageAccessToken: string, recipientId: string, text: string) {
    const url = `https://graph.facebook.com/${this.graphVersion}/me/messages`;
    const response = await fetch(`${url}?access_token=${encodeURIComponent(pageAccessToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Error enviando mensaje Meta a ${recipientId}: ${response.status} ${errorBody}`);
    }
    return response.ok;
  }
}
