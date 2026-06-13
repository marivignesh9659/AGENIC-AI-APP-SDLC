import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const azureHealthCheckTool = createTool({
  id: 'azure-health-check',
  description: 'Checks health of Azure App Service, API, and SQL Server',
  inputSchema: z.object({
    environment: z.string(),  // dev | qa | uat | production
    checkType: z.string().optional(), // full | api | database | frontend
  }),
  outputSchema: z.object({
    healthy: z.boolean(),
    appServiceStatus: z.string(),
    apiStatus: z.string(),
    databaseStatus: z.string(),
    responseTimeMs: z.number(),
    issues: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const checkType = context.checkType ?? 'full';
    console.log(`💊 Health check: ${context.environment} (${checkType})`);
    return {
      healthy: true,
      appServiceStatus: 'Running',
      apiStatus: 'Running',
      databaseStatus: 'Connected',
      responseTimeMs: 142,
      issues: [],
    };
  },
});

export const azureAppInsightsTool = createTool({
  id: 'azure-app-insights',
  description: 'Fetches metrics from Azure Application Insights',
  inputSchema: z.object({
    environment: z.string(),  // dev | qa | uat | production
    metric: z.string(),       // errors | performance | availability | requests
    timeRangeMinutes: z.number().optional(),
  }),
  outputSchema: z.object({
    metric: z.string(),
    value: z.number(),
    threshold: z.number(),
    breached: z.boolean(),
    recommendation: z.string(),
  }),
  execute: async ({ context }) => {
    console.log(`📊 App Insights: ${context.metric} (${context.environment})`);
    const thresholds: Record<string, number> = {
      errors: 10, performance: 2000, availability: 99, requests: 1000,
    };
    const mockValues: Record<string, number> = {
      errors: 2, performance: 450, availability: 99.9, requests: 230,
    };
    const value     = mockValues[context.metric] ?? 0;
    const threshold = thresholds[context.metric] ?? 100;
    return {
      metric: context.metric,
      value,
      threshold,
      breached: value > threshold,
      recommendation: value > threshold
        ? `${context.metric} exceeded threshold — investigate immediately`
        : `${context.metric} is within normal range`,
    };
  },
});

export const azureRaiseBlockerTool = createTool({
  id: 'azure-raise-blocker',
  description: 'Raises a blocker in Jira and notifies team when Azure health fails',
  inputSchema: z.object({
    environment: z.string(),
    issue: z.string(),
    severity: z.string(),  // Critical | High | Medium
    affectedServices: z.array(z.string()),
  }),
  outputSchema: z.object({
    blockerId: z.string(),
    notified: z.boolean(),
    escalated: z.boolean(),
  }),
  execute: async ({ context }) => {
    const blockerId = `BLOCKER-${Math.floor(Math.random() * 9000) + 1000}`;
    console.log(`🚨 BLOCKER: ${blockerId} — ${context.issue} (${context.severity})`);
    return {
      blockerId,
      notified: true,
      escalated: context.severity === 'Critical',
    };
  },
});