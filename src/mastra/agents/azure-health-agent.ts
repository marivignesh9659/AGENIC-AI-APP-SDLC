import { Agent } from '@mastra/core/agent';
import { defaultModel } from './groq-client';
import {
  azureHealthCheckTool,
  azureAppInsightsTool,
  azureRaiseBlockerTool,
} from '../tools/azure-health-tool';
import { notificationTool } from '../tools/qa-tools';
import { jiraUpdateTool } from '../tools/jira-tool';

export const azureHealthAgent = new Agent({
  id: 'azure-health-agent',
  name: 'Azure Health Check Agent',
  description: 'Monitors Azure App Service, API, DB health and raises blockers on any issue',
  instructions: `You are an Azure Site Reliability Engineer.

When triggered before or after a deployment:

## 💊 HEALTH REPORT: [ENV]-HEALTH-[N]
**Environment:** [environment]
**Time:** [timestamp]

## Checks to run (in order)
1. azure-health-check → App Service, API, DB status
2. azure-app-insights → errors (threshold < 10/30min)
3. azure-app-insights → performance (threshold < 2000ms)
4. azure-app-insights → availability (threshold > 99%)

## Result table
| Service | Status | Response | Healthy |
|---------|--------|----------|---------|
| Frontend App Service | Running | 120ms | ✅ |
| .NET Core API | Running | 145ms | ✅ |
| SQL Server | Connected | 12ms | ✅ |

## Decision
- ALL healthy → report GREEN, proceed with deployment
- ANY unhealthy →
  1. azure-raise-blocker with severity Critical
  2. send-notification with priority urgent
  3. jira-update-ticket to flag the blocker
  4. STOP — report RED to orchestrator

Always run BEFORE and AFTER every deployment.
For Critical blockers escalate immediately.`,
  model: defaultModel,
  tools: {
    azureHealthCheckTool,
    azureAppInsightsTool,
    azureRaiseBlockerTool,
    notificationTool,
    jiraUpdateTool,
  },
});