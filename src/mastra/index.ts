import { Mastra } from '@mastra/core';

// ── Agents ───────────────────────────────────────────────────
import { projectManagerAgent } from './agents/project-manager-agent';
import { jiraAgent } from './agents/jira-agent';
import { figmaAgent } from './agents/figma-agent';
import { scrumMasterAgent } from './agents/scrum-master-agent';
import { devAgent } from './agents/dev-agent';
import { devopsAgent } from './agents/devops-agent';
import { qaAgent } from './agents/qa-agent';
import { deployAgent } from './agents/deploy-agent';
import { azureHealthAgent } from './agents/azure-health-agent';
import { monitoringAgent, releaseNotesAgent, documentationAgent } from './agents/post-prod-agents';

// ── Workflows ─────────────────────────────────────────────────
import { sdlcWorkflow } from './workflows/sdlc-workflow';

export const mastra = new Mastra({
  agents: {
    projectManagerAgent,   // 🎯 Master orchestrator
    jiraAgent,             // 📋 Requirement intake
    figmaAgent,            // 🎨 Design spec
    scrumMasterAgent,      // 🏃 Sprint planning
    devAgent,              // 💻 Full stack development
    devopsAgent,           // 🏗️ CI/CD + infrastructure
    qaAgent,               // 🧪 Full QA suite
    deployAgent,           // 🚀 UAT + production deploy
    azureHealthAgent,      // 💊 Azure health monitoring
    monitoringAgent,       // 📊 Post-prod monitoring
    releaseNotesAgent,     // 📋 Release notes
    documentationAgent,    // 📚 Documentation
  },

  workflows: {
    sdlcWorkflow,          // 🔄 Full 12-step SDLC workflow
  },
});