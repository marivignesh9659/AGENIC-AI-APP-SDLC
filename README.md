# 🤖 SDLC Agentic AI — Mastra TypeScript

## What This Project Does

This is a complete **Agentic AI SDLC demo pipeline** built with **Mastra TypeScript**.

One business requirement goes in, and the workflow generates a full SDLC output:

```text
Requirement
→ Requirement Analysis
→ Jira Ticket
→ API Contract
→ UI/UX Design Spec
→ Sprint Plan
→ Infrastructure Plan
→ Database Artifacts
→ Backend Artifacts
→ Frontend Artifacts
→ Integration Validation
→ QA Report
→ UAT / Production Deployment Simulation
→ Monitoring
→ Release Notes
→ Documentation
→ SDLC Scoring
→ Final Command Center Summary
```

This is a **demo / POC project**.
The AI-generated SDLC artifacts are real outputs from the model, but external enterprise actions such as Jira creation, GitHub PR creation, Azure DevOps deployment, App Insights monitoring, and QA execution are simulated through tools.

The architecture is designed so mock tools can later be replaced with real REST API integrations.

---

## Core Idea

Traditional SDLC involves many roles:

```text
Business Analyst
Product Owner
Solution Architect
UI/UX Designer
Scrum Master
Developer
QA Engineer
DevOps Engineer
Release Manager
Support / Monitoring Team
```

This project models those responsibilities using specialist AI agents.

The goal is not to let one AI agent do everything.
The goal is to use **controlled orchestration** with clear separation of concern.

---

## Architecture Overview

```text
Business Requirement
        ↓
sdlcWorkflow
        ↓
Requirement Analyzer Agent
        ↓
Blocker Agent, if requirement is weak
        ↓
Jira Agent
        ↓
API Contract Agent + Figma Agent
        ↓
Scrum Master Agent
        ↓
DevOps Agent
        ↓
Development Orchestrator Agent
        ↓
┌──────────────────────────────────────────────┐
│ Database Agent          SQL Server only       │
│ Backend Agent           .NET Core 8 only      │
│ Frontend Agent          React TypeScript only │
│ Integration Validator   DB/API/UI check       │
└──────────────────────────────────────────────┘
        ↓
QA Agent
        ↓
UAT Health + Deployment
        ↓
Production Health + Deployment
        ↓
Monitoring + Release Notes + Documentation
        ↓
SDLC Scorers
        ↓
Final Command Center Summary
```

---

## Agent Responsibilities

| Agent                       | Responsibility                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `requirementAnalyzerAgent`  | Checks requirement clarity, missing details, assumptions, acceptance criteria, and risk |
| `blockerAgent`              | Creates blocker reports and routes failures to correct owners                           |
| `jiraAgent`                 | Creates and updates Jira-style tickets                                                  |
| `apiContractAgent`          | Creates contract-first API design with routes, DTOs, validation, auth, and errors       |
| `figmaAgent`                | Creates UI/UX design specification and component guidance                               |
| `scrumMasterAgent`          | Creates sprint plan, stories, tasks, estimates, and dependencies                        |
| `devopsAgent`               | Creates Azure infrastructure and CI/CD deployment plan                                  |
| `devAgent`                  | Development orchestrator; coordinates DB/backend/frontend outputs                       |
| `databaseAgent`             | Generates SQL Server tables, indexes, procedures, and migration notes                   |
| `backendAgent`              | Generates .NET Core 8 API artifacts                                                     |
| `frontendAgent`             | Generates React TypeScript UI artifacts                                                 |
| `integrationValidatorAgent` | Validates DB, backend, frontend, and API contract consistency                           |
| `qaAgent`                   | Simulates code review, QA testing, security, accessibility, and chaos testing           |
| `azureHealthAgent`          | Simulates Azure environment health checks                                               |
| `deployAgent`               | Simulates UAT and production deployment                                                 |
| `monitoringAgent`           | Generates post-production monitoring report                                             |
| `releaseNotesAgent`         | Generates release notes                                                                 |
| `documentationAgent`        | Generates API docs, frontend docs, ADR, README notes, and runbook                       |

---

## Why Separation of Concern Matters

Earlier, one full-stack Dev Agent was responsible for:

```text
SQL + .NET + React + Jira + GitHub PR
```

That becomes a **God Agent**.

The improved architecture separates the responsibility:

```text
Dev Orchestrator Agent
   ├── Database Agent
   ├── Backend Agent
   ├── Frontend Agent
   └── Integration Validator Agent
```

This gives better control, cleaner prompts, easier debugging, and better enterprise explainability.

---

## Contract-First Design

The `apiContractAgent` creates a shared contract before development starts.

Example output:

```text
GET    /api/roles
GET    /api/roles/{id}
POST   /api/roles
PUT    /api/roles/{id}
DELETE /api/roles/{id}
POST   /api/roles/{id}/permissions
GET    /api/roles/{id}/audit-log
```

The database, backend, and frontend agents all use this contract as the source of truth.

This prevents common AI-generated mismatches such as:

```text
Frontend calls: /api/roles
Backend creates: /api/role-management
```

---

## Human Approval Gates

Human gates are currently **simulated** for demo purposes.

| Gate   | Approver      | When                                            |
| ------ | ------------- | ----------------------------------------------- |
| Gate 1 | Product Owner | After requirement quality check                 |
| Gate 2 | Tech Lead     | After API contract, design, and sprint planning |
| Gate 3 | Tech Lead     | After development and code review               |
| Gate 4 | QA Lead       | After QA testing                                |
| Gate 5 | PM / Business | After UAT validation                            |
| Gate 6 | PM + DevOps   | Before production go-live                       |

In production, these simulated gates should be replaced with real human-in-the-loop workflow pause/resume approval.

---

## Failure Routing

The workflow supports controlled demo failure modes.

| Failure Scenario     | Routed To            | Purpose                                 |
| -------------------- | -------------------- | --------------------------------------- |
| Bad requirement      | Product Owner        | Requirement clarification               |
| Integration mismatch | Tech Lead / Dev Team | Fix API, DTO, DB, and frontend mismatch |
| QA fail              | QA Lead + Dev Team   | Fix defects and re-run tests            |
| Health fail          | DevOps               | Fix environment or service health       |
| Production issue     | PM + DevOps          | Rollback decision                       |

Example failure input:

```json
{
  "requirement": "Create Role Management module for an admin portal. Admin should be able to create, edit, delete, search roles, assign permissions to roles, view audit log for role changes, and restrict access to admin users only. The module should use React TypeScript frontend, .NET Core 8 API, and SQL Server database.",
  "demoFailureMode": "integration_mismatch"
}
```

Supported values:

```text
none
bad_requirement
integration_mismatch
qa_fail
health_fail
prod_issue
```

---

## SDLC Scorers

The project includes local deterministic scorers.

Scorers are not agents.
They evaluate workflow output quality after generation.

| Scorer                        | What It Evaluates                                          |
| ----------------------------- | ---------------------------------------------------------- |
| Requirement Quality Score     | Requirement clarity and risk                               |
| API Contract Score            | Routes, DTOs, validation, authorization, error response    |
| Development Separation Score  | Whether DB/backend/frontend responsibilities are separated |
| Integration Validation Score  | Whether DB, backend, frontend, and contract align          |
| QA Readiness Score            | QA pass/fail readiness                                     |
| Deployment Readiness Score    | UAT and production readiness                               |
| Overall SDLC Confidence Score | Final average confidence score                             |

Final output includes:

```text
SDLC SCORER REPORT
Overall SDLC Confidence Score
Score Breakdown
Recommendation
```

---

## Tools Used

| Tool                          | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `jira-create-ticket`          | Simulates Jira ticket creation          |
| `jira-update-ticket`          | Simulates Jira ticket status update     |
| `figma-create-spec`           | Simulates Figma design registration     |
| `figma-get-component-library` | Simulates fetching Figma components     |
| `github-create-branch`        | Simulates GitHub branch creation        |
| `github-create-pr`            | Simulates GitHub PR creation            |
| `github-security-scan`        | Simulates CodeQL/security scan          |
| `azure-trigger-pipeline`      | Simulates Azure DevOps pipeline trigger |
| `azure-slot-swap`             | Simulates zero-downtime deployment      |
| `azure-keyvault-set`          | Simulates storing secrets in Key Vault  |
| `azure-deploy-bicep`          | Simulates infrastructure provisioning   |
| `azure-health-check`          | Simulates Azure health check            |
| `azure-app-insights`          | Simulates App Insights metrics          |
| `azure-raise-blocker`         | Simulates blocker ticket creation       |
| `playwright-run-tests`        | Simulates E2E tests                     |
| `xunit-run-tests`             | Simulates .NET unit tests               |
| `owasp-security-scan`         | Simulates OWASP security scan           |
| `accessibility-check`         | Simulates WCAG accessibility check      |
| `chaos-testing`               | Simulates resilience testing            |
| `send-notification`           | Simulates Teams/email notification      |

---

## Model Provider

The project uses **Gemini 2.5 Flash-Lite** through the AI SDK Google provider.

Central model helper:

```text
src/mastra/agents/groq-client.ts
```

Even though the file name says `groq-client.ts`, the current implementation uses Gemini:

```ts
import { google } from '@ai-sdk/google';

export const defaultModel = google('gemini-2.5-flash-lite');
```

This keeps all existing agent imports unchanged:

```ts
import { defaultModel } from './groq-client';
```

---

## Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Create `.env`

Create a `.env` file in the project root.

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_studio_api_key_here
```

### 3. Build

```bash
npm run build
```

### 4. Start Mastra

```bash
npm run dev
```

### 5. Open Mastra Studio

```text
http://localhost:4111
```

---

## How to Demo

### Recommended: Run the Full Workflow

Open:

```text
http://localhost:4111
```

Then:

```text
Workflows → sdlcWorkflow → Run
```

Paste:

```json
{
  "requirement": "Create Role Management module for an admin portal. Admin should be able to create, edit, delete, search roles, assign permissions to roles, view audit log for role changes, and restrict access to admin users only. The module should use React TypeScript frontend, .NET Core 8 API, and SQL Server database.",
  "demoFailureMode": "none"
}
```

This triggers the full agentic SDLC lifecycle.

---

## Happy Path Demo

Use:

```json
{
  "requirement": "Create Role Management module for an admin portal. Admin should be able to create, edit, delete, search roles, assign permissions to roles, view audit log for role changes, and restrict access to admin users only. The module should use React TypeScript frontend, .NET Core 8 API, and SQL Server database.",
  "demoFailureMode": "none"
}
```

Expected output includes:

```text
Requirement Quality Report
Jira Ticket
API Contract
Design Spec
Sprint Plan
Infrastructure Plan
Database Artifacts
Backend Artifacts
Frontend Artifacts
Integration Validation Report
QA Report
Deployment Report
Monitoring Report
Release Notes
Documentation
SDLC Scorer Report
Command Center Summary
```

---

## Failure Demo

### Bad Requirement

```json
{
  "requirement": "Build user thing",
  "demoFailureMode": "bad_requirement"
}
```

Expected routing:

```text
Bad requirement → Product Owner clarification
```

### Integration Mismatch

```json
{
  "requirement": "Create Role Management module for an admin portal. Admin should be able to create, edit, delete, search roles, assign permissions to roles, view audit log for role changes, and restrict access to admin users only. The module should use React TypeScript frontend, .NET Core 8 API, and SQL Server database.",
  "demoFailureMode": "integration_mismatch"
}
```

Expected routing:

```text
Integration mismatch → Tech Lead / Dev Team
```

### QA Failure

```json
{
  "requirement": "Create Role Management module for an admin portal. Admin should be able to create, edit, delete, search roles, assign permissions to roles, view audit log for role changes, and restrict access to admin users only. The module should use React TypeScript frontend, .NET Core 8 API, and SQL Server database.",
  "demoFailureMode": "qa_fail"
}
```

Expected routing:

```text
QA fail → QA Lead + Dev Team
```

### Health Failure

```json
{
  "requirement": "Create Role Management module for an admin portal. Admin should be able to create, edit, delete, search roles, assign permissions to roles, view audit log for role changes, and restrict access to admin users only. The module should use React TypeScript frontend, .NET Core 8 API, and SQL Server database.",
  "demoFailureMode": "health_fail"
}
```

Expected routing:

```text
Health fail → DevOps
```

### Production Issue

```json
{
  "requirement": "Create Role Management module for an admin portal. Admin should be able to create, edit, delete, search roles, assign permissions to roles, view audit log for role changes, and restrict access to admin users only. The module should use React TypeScript frontend, .NET Core 8 API, and SQL Server database.",
  "demoFailureMode": "prod_issue"
}
```

Expected routing:

```text
Prod issue → PM + DevOps rollback decision
```

---

## File Structure

```text
src/mastra/
  agents/
    groq-client.ts                  ← Central model provider helper
    project-manager-agent.ts        ← SDLC supervisor explanation agent
    requirement-analyzer-agent.ts   ← Requirement quality check
    blocker-agent.ts                ← Failure routing and escalation
    jira-agent.ts                   ← Jira-style requirement intake
    api-contract-agent.ts           ← Contract-first API design
    figma-agent.ts                  ← UI/UX design spec
    scrum-master-agent.ts           ← Sprint planning
    devops-agent.ts                 ← Infrastructure and CI/CD plan
    dev-agent.ts                    ← Development orchestrator
    database-agent.ts               ← SQL Server artifacts
    backend-agent.ts                ← .NET Core 8 API artifacts
    frontend-agent.ts               ← React TypeScript artifacts
    integration-validator-agent.ts  ← DB/API/UI consistency validation
    qa-agent.ts                     ← QA testing and quality checks
    deploy-agent.ts                 ← UAT and production deployment
    azure-health-agent.ts           ← Health checks
    post-prod-agents.ts             ← Monitoring, release notes, documentation

  tools/
    jira-tool.ts                    ← Jira create/update simulation
    figma-tool.ts                   ← Figma API simulation
    github-tool.ts                  ← GitHub branch/PR/scan simulation
    azure-devops-tool.ts            ← Pipeline/slot/bicep simulation
    azure-health-tool.ts            ← Health/insights/blocker simulation
    qa-tools.ts                     ← QA and notification tools

  scorers/
    sdlc-scorers.ts                 ← Local SDLC scoring functions

  workflows/
    sdlc-workflow.ts                ← Main workflow

  index.ts                         ← Mastra registration
```

---

## Recommended 30-Minute Demo Flow

|      Time | Topic                                                                      |
| --------: | -------------------------------------------------------------------------- |
|   0–3 min | Problem statement and goal                                                 |
|   3–6 min | Mastra architecture: agents, workflow, tools, scorers                      |
|   6–9 min | Run the workflow with one requirement                                      |
|  9–17 min | Walk through requirement, Jira, API contract, design, sprint, infra agents |
| 17–23 min | Deep dive into DB/backend/frontend separation and integration validation   |
| 23–26 min | Show one controlled failure mode                                           |
| 26–28 min | Explain SDLC scorers                                                       |
| 28–30 min | Limitations and production roadmap                                         |

---

## What Is Real vs Mock

### Real

```text
AI-generated SDLC artifacts
Agent orchestration
Workflow execution
Requirement analysis
API contract generation
Code artifact generation
Integration validation text
Scoring report
Final command center summary
```

### Mock / Simulated

```text
Actual Jira ticket creation
Actual GitHub branch creation
Actual GitHub PR creation
Actual Azure DevOps pipeline execution
Actual Azure deployment
Actual App Insights metrics
Actual Playwright/xUnit/OWASP execution
```

---

## Production Upgrade Roadmap

To make this production-ready:

```text
1. Replace Jira mock tool with Jira REST API.
2. Replace GitHub mock tool with GitHub branch/commit/PR APIs.
3. Write generated artifacts to files.
4. Commit generated files to a feature branch.
5. Trigger real Azure DevOps pipelines.
6. Execute real Playwright and xUnit tests.
7. Pull real App Insights metrics.
8. Implement real human approval using workflow suspend/resume.
9. Store run history and generated artifacts.
10. Add enterprise authentication and audit logging.
```

---

## Important Demo Positioning

Do not say:

```text
This fully deploys a real production application.
```

Say:

```text
This is a complete Agentic SDLC demo/POC. It generates real SDLC artifacts and simulates enterprise integrations. The architecture is designed so Jira, GitHub, Azure DevOps, QA, App Insights, and approval gates can later be replaced with real enterprise integrations.
```

---

## Summary

This project demonstrates:

```text
Controlled Agentic SDLC orchestration
Contract-first design
Separation of concern
Failure routing
Human approval modeling
Mock enterprise integrations
SDLC scoring
Final command center reporting
```

The main value is not just code generation.

The main value is **governed AI-assisted software delivery**.
