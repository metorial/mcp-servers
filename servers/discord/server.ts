import { metorial, z } from '@metorial/mcp-server-sdk';

/**
 * Discord MCP Server
 * Provides tools and resources for interacting with Discord API
 */

interface Config {
  token: string;
}

metorial.createServer<Config>(
  {
    name: 'discord-mcp-server',
    version: '1.0.0'
  },
  async (server, config) => {
    // Base Discord API URL
    const DISCORD_API_BASE = 'https://discord.com/api/v10';

    /**
     * Helper function to make Discord API requests
     */
    async function discordRequest(
      endpoint: string,
      method: string = 'GET',
      body?: unknown
    ): Promise<any> {
      const headers: Record<string, string> = {
        Authorization: `Bot ${config.token}`,
        'Content-Type': 'application/json'
      };

      const options: RequestInit = {
        method,
        headers
      };

      if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${DISCORD_API_BASE}${endpoint}`, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord API Error (${response.status}): ${errorText}`);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    }

    // ============================================================================
    // TOOLS - Channel Management
    // ============================================================================

    /**
     * List messages from a channel
     */
    server.registerTool(
      'list_channel_messages',
      {
        title: 'List Channel Messages',
        description: 'List messages from a Discord channel',
        inputSchema: {
          channelId: z.string().describe('The ID of the channel'),
          limit: z
            .number()
            .optional()
            .describe('Number of messages to retrieve (1-100, default 50)'),
          before: z.string().optional().describe('Get messages before this message ID'),
          after: z.string().optional().describe('Get messages after this message ID')
        }
      },
      async ({ channelId, limit, before, after }) => {
        let endpoint = `/channels/${channelId}/messages?`;
        if (limit) endpoint += `limit=${limit}&`;
        if (before) endpoint += `before=${before}&`;
        if (after) endpoint += `after=${after}&`;

        const messages = await discordRequest(endpoint);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(messages, null, 2)
            }
          ]
        };
      }
    );

    /**
     * Send a message to a channel
     */
    server.registerTool(
      'send_message',
      {
        title: 'Send Message',
        description: 'Send a message to a Discord channel',
        inputSchema: {
          channelId: z.string().describe('The ID of the channel'),
          content: z.string().describe('The message content'),
          tts: z.boolean().optional().describe('Send as text-to-speech message'),
          embeds: z.array(z.record(z.any())).optional().describe('Array of embed objects')
        }
      },
      async ({ channelId, content, tts, embeds }) => {
        const body: any = { content };
        if (tts) body.tts = tts;
        if (embeds) body.embeds = embeds;

        const message = await discordRequest(`/channels/${channelId}/messages`, 'POST', body);

        return {
          content: [
            {
              type: 'text',
              text: `Message sent successfully: ${JSON.stringify(message, null, 2)}`
            }
          ]
        };
      }
    );

    /**
     * Edit an existing message
     */
    server.registerTool(
      'edit_message',
      {
        title: 'Edit Message',
        description: 'Edit an existing message in a Discord channel',
        inputSchema: {
          channelId: z.string().describe('The ID of the channel'),
          messageId: z.string().describe('The ID of the message to edit'),
          content: z.string().describe('The new message content')
        }
      },
      async ({ channelId, messageId, content }) => {
        const message = await discordRequest(
          `/channels/${channelId}/messages/${messageId}`,
          'PATCH',
          { content }
        );

        return {
          content: [
            {
              type: 'text',
              text: `Message edited successfully: ${JSON.stringify(message, null, 2)}`
            }
          ]
        };
      }
    );

    /**
     * Delete a message
     */
    server.registerTool(
      'delete_message',
      {
        title: 'Delete Message',
        description: 'Delete a message from a Discord channel',
        inputSchema: {
          channelId: z.string().describe('The ID of the channel'),
          messageId: z.string().describe('The ID of the message to delete')
        }
      },
      async ({ channelId, messageId }) => {
        await discordRequest(`/channels/${channelId}/messages/${messageId}`, 'DELETE');

        return {
          content: [
            {
              type: 'text',
              text: 'Message deleted successfully'
            }
          ]
        };
      }
    );
  }
);
