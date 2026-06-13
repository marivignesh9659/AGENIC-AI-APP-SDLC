import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const jiraCreateTool = createTool({
  id: 'jira-create-ticket',
  description: 'Creates a Jira ticket with full details',
  inputSchema: z.object({
    title: z.string(),
    description: z.string(),
    type: z.string().optional(),
    priority: z.string().optional(),
    storyPoints: z.number().optional(),
    labels: z.array(z.string()).optional(),
    acceptanceCriteria: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    ticketId: z.string(),
    ticketUrl: z.string(),
    status: z.string(),
  }),
  execute: async ({ context }) => {
    const ticketId = `PROJ-${Math.floor(Math.random() * 9000) + 1000}`;
    console.log(`📋 Jira ticket created: ${ticketId} — ${context.title}`);
    return {
      ticketId,
      ticketUrl: `https://yourcompany.atlassian.net/browse/${ticketId}`,
      status: 'To Do',
    };
  },
});

export const jiraUpdateTool = createTool({
  id: 'jira-update-ticket',
  description: 'Updates an existing Jira ticket status or adds a comment',
  inputSchema: z.object({
    ticketId: z.string(),
    status: z.string().optional(),
    comment: z.string().optional(),
    assignee: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    ticketId: z.string(),
  }),
  execute: async ({ context }) => {
    console.log(`🔄 Jira updated: ${context.ticketId} → ${context.status ?? 'comment added'}`);
    return { success: true, ticketId: context.ticketId };
  },
});