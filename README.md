🤖 SDLC Agentic AI — Mastra TypeScript

What This Does

A complete AI-powered SDLC pipeline built with Mastra TypeScript.
One requirement goes in → Full SDLC output comes out automatically.

Architecture

Business Requirement
        ↓
Project Manager Agent (Supervisor Orchestrator)
        ↓
┌─────────────────────────────────────────────────┐
│  Phase 1:  Jira Agent        (Requirement)       │
│  Phase 2:  Figma Agent       (Design)            │
│  Phase 3:  Scrum Master      (Sprint Planning)   │
│  Phase 4:  DevOps Agent      (Infrastructure)    │
│  Phase 5:  Dev Agent         (Code Generation)   │
│  Phase 6:  QA Agent          (Full Testing)      │
│  Phase 7:  Health Agent      (UAT health check)  │
│  Phase 8:  Deploy Agent      (UAT Deployment)    │
│  Phase 9:  Health Agent      (Prod health check) │
│  Phase 10: Deploy Agent      (Production)        │
│  Phase 11: Monitoring +      (parallel)          │
│            Release Notes +                       │
│            Documentation                         │
│  Phase 12: Final Summary     (Dashboard)         │
└─────────────────────────────────────────────────┘

Human Gates

GateWhoWhen1Product OwnerAfter requirement2Tech LeadAfter sprint planning3Tech LeadCode review sign-off4QA LeadQA sign-off5Project ManagerUAT approval6PM + DevOpsProduction go-live

Tools Used

ToolPurposejira-create-ticketCreate Jira ticketsjira-update-ticketUpdate ticket statusfigma-create-specRegister Figma designfigma-get-component-libraryFetch existing componentsgithub-create-branchCreate feature branchgithub-create-prCreate pull requestgithub-security-scanRun CodeQL scanazure-trigger-pipelineStart CI/CD pipelineazure-slot-swapZero-downtime deployazure-keyvault-setStore secretsazure-deploy-bicepProvision infrastructureazure-health-checkCheck app healthazure-app-insightsFetch metricsazure-raise-blockerRaise blocker ticketplaywright-run-testsE2E testsxunit-run-tests.NET unit testsowasp-security-scanSecurity scanaccessibility-checkWCAG 2.1 checkchaos-testingResilience testingsend-notificationTeams/Email notify

Setup

1. Install dependencies

bashnpm install

2. Create .env file

bashcp .env.example .env

Add your GROQ_API_KEY (free at console.groq.com)

3. Start Mastra

bashnpm run dev

4. Open Mastra Studio

http://localhost:4111

How to Demo

Option A — Project Manager Agent (Full SDLC)


Open localhost:4111
Click Agents → Project Manager
Type:


Build a User Login feature with Azure AD authentication.
Users login with company email, get JWT token, redirect to dashboard.


Watch all 12 phases execute automatically!


Option B — SDLC Workflow


Click Workflows → sdlc-workflow
Enter requirement
See each of 12 steps execute with results


Option C — Individual Agents

Test each agent independently for demos of specific phases.

File Structure

src/mastra/
  agents/
    project-manager-agent.ts  ← Master orchestrator
    jira-agent.ts             ← Requirement intake
    figma-agent.ts            ← Design spec
    scrum-master-agent.ts     ← Sprint planning
    dev-agent.ts              ← Code generation
    devops-agent.ts           ← CI/CD + infrastructure
    qa-agent.ts               ← Full test suite
    deploy-agent.ts           ← UAT + production
    azure-health-agent.ts     ← Health monitoring
    post-prod-agents.ts       ← Monitoring, release, docs
  tools/
    jira-tool.ts              ← Jira create/update
    figma-tool.ts             ← Figma API
    github-tool.ts            ← GitHub branch/PR/scan
    azure-devops-tool.ts      ← Pipeline/slot/bicep
    azure-health-tool.ts      ← Health/insights/blocker
    qa-tools.ts               ← All QA + notify tools
  workflows/
    sdlc-workflow.ts          ← 12-step main workflow
  index.ts                    ← Mastra registration