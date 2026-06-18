import { Mastra } from '@mastra/core';

// ── Agents ───────────────────────────────────────────────────
import { projectManagerAgent } from './agents/project-manager-agent';
import { requirementAnalyzerAgent } from './agents/requirement-analyzer-agent';
import { jiraAgent } from './agents/jira-agent';
import { apiContractAgent } from './agents/api-contract-agent';
import { figmaAgent } from './agents/figma-agent';
import { scrumMasterAgent } from './agents/scrum-master-agent';

import { devAgent } from './agents/dev-agent';
import { databaseAgent } from './agents/database-agent';
import { backendAgent } from './agents/backend-agent';
import { frontendAgent } from './agents/frontend-agent';
import { integrationValidatorAgent } from './agents/integration-validator-agent';
import { blockerAgent } from './agents/blocker-agent';

import { devopsAgent } from './agents/devops-agent';
import { qaAgent } from './agents/qa-agent';
import { deployAgent } from './agents/deploy-agent';
import { azureHealthAgent } from './agents/azure-health-agent';
import {
  monitoringAgent,
  releaseNotesAgent,
  documentationAgent,
} from './agents/post-prod-agents';

// ── Workflows ─────────────────────────────────────────────────
import { sdlcWorkflow } from './workflows/sdlc-workflow';

export const mastra = new Mastra({
  agents: {
    // Master orchestrator
    projectManagerAgent,

    // Requirement / planning agents
    requirementAnalyzerAgent,
    jiraAgent,
    apiContractAgent,
    figmaAgent,
    scrumMasterAgent,

    // Development agents
    devAgent,
    databaseAgent,
    backendAgent,
    frontendAgent,
    integrationValidatorAgent,
    blockerAgent,

    // DevOps / QA / Deploy agents
    devopsAgent,
    qaAgent,
    deployAgent,
    azureHealthAgent,

    // Post-production agents
    monitoringAgent,
    releaseNotesAgent,
    documentationAgent,
  },
  workflows: {
    sdlcWorkflow,
  },
});
