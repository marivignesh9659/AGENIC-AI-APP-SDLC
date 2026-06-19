import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  buildScoreReport,
  scoreApiContract,
  scoreDeploymentReadiness,
  scoreDevelopmentSeparation,
  scoreIntegrationValidation,
  scoreQaReadiness,
  scoreRequirementQuality,
} from '../scorers/sdlc-scorers';
import { requirementAnalyzerAgent } from '../agents/requirement-analyzer-agent';
import { jiraAgent } from '../agents/jira-agent';
import { apiContractAgent } from '../agents/api-contract-agent';
import { figmaAgent } from '../agents/figma-agent';
import { scrumMasterAgent } from '../agents/scrum-master-agent';
import { devopsAgent } from '../agents/devops-agent';
import { devAgent } from '../agents/dev-agent';
import { databaseAgent } from '../agents/database-agent';
import { backendAgent } from '../agents/backend-agent';
import { frontendAgent } from '../agents/frontend-agent';
import { integrationValidatorAgent } from '../agents/integration-validator-agent';
import { blockerAgent } from '../agents/blocker-agent';
import { qaAgent } from '../agents/qa-agent';
import { deployAgent } from '../agents/deploy-agent';
import { azureHealthAgent } from '../agents/azure-health-agent';
import {
  monitoringAgent,
  releaseNotesAgent,
  documentationAgent,
} from '../agents/post-prod-agents';
import {
  buildGuardrailReport,
  runRequirementGuardrails,
} from '../guardrails/guardrails';

import {
  appendSdlcMemory,
  getRecentSdlcMemorySummary,
} from '../memory/sdlc-memory';
// ─────────────────────────────────────────────────────────────
// SHARED HELPERS / SCHEMAS
// ─────────────────────────────────────────────────────────────
const requirementInput = z.object({
  requirement: z.string(),
  demoFailureMode: z
    .enum([
      'none',
      'bad_requirement',
      'integration_mismatch',
      'qa_fail',
      'health_fail',
      'prod_issue',
    ])
    .optional()
    .default('none'),
  userId: z.string().optional().default('demo-user'),
});

const isFailureText = (value: string) => {
  const lower = value.toLowerCase();
  return (
    lower.includes('fail') ||
    lower.includes('failed') ||
    lower.includes('blocker') ||
    lower.includes('critical') ||
    lower.includes('stop')
  );
};

const getSafePreview = (value: string, length = 1200) =>
  value.length > length ? `${value.substring(0, length)}...` : value;

  const asString = (value: unknown): string => {
    return typeof value === 'string' ? value : '';
  };

  const step0GuardrailsAndMemory = createStep({
    id: 'step-0-guardrails-and-memory',
    description: 'Runs SDLC guardrails and loads previous run memory',
    inputSchema: requirementInput,
    outputSchema: z.object({
      requirement: z.string(),
      demoFailureMode: z.string(),
      userId: z.string(),
      guardrailReport: z.string(),
      guardrailBlocked: z.boolean(),
      memorySummary: z.string(),
    }),
    execute: async ({ inputData }) => {
      console.log('\nPHASE 0: Guardrails + Memory...');
  
      const demoFailureMode = inputData.demoFailureMode ?? 'none';
      const userId = inputData.userId ?? 'demo-user';
  
      const guardrailResult = runRequirementGuardrails(inputData.requirement);
      const guardrailReport = buildGuardrailReport(guardrailResult);
      const memorySummary = await getRecentSdlcMemorySummary(userId);
  
      console.log(
        guardrailResult.status === 'PASS'
          ? '✅ Guardrails passed'
          : '🚨 Guardrails blocked request',
      );
  
      return {
        requirement: inputData.requirement,
        demoFailureMode,
        userId,
        guardrailReport,
        guardrailBlocked: guardrailResult.status === 'BLOCKED',
        memorySummary,
      };
    },
  });
// ─────────────────────────────────────────────────────────────
// STEP 1: REQUIREMENT QUALITY CHECK
// ─────────────────────────────────────────────────────────────
const step1RequirementQuality = createStep({
  id: 'step-1-requirement-quality',
  description: 'Requirement Analyzer checks clarity, assumptions, acceptance criteria, and risk before Jira creation',
  inputSchema: z.object({
    requirement: z.string(),
    demoFailureMode: z.string(),
    userId: z.string(),
    guardrailReport: z.string(),
    guardrailBlocked: z.boolean(),
    memorySummary: z.string(),
  }),
  outputSchema: z.object({
    requirement: z.string(),
    demoFailureMode: z.string(),
    userId: z.string(),
    guardrailReport: z.string(),
    guardrailBlocked: z.boolean(),
    memorySummary: z.string(),
    requirementQualityReport: z.string(),
    requirementRiskDetected: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 1: Requirement Quality Check...');
  
    if (inputData.guardrailBlocked) {
      return {
        ...inputData,
        requirementQualityReport: `
  STATUS: FAIL
  
  # REQUIREMENT QUALITY REPORT
  
  The request was blocked by pre-SDLC guardrails.
  
  ${inputData.guardrailReport}
  `,
        requirementRiskDetected: true,
      };
    }
  
    const res = await requirementAnalyzerAgent.generate([
      {
        role: 'user',
        content: `Analyze this business requirement before SDLC starts:\n\n${inputData.requirement}`,
      },
    ]);
  
    const requirementQualityReport = res.text;
  
    const requirementRiskDetected =
      requirementQualityReport.toLowerCase().includes('needs_clarification') ||
      requirementQualityReport.toLowerCase().includes('risk level\n\nhigh') ||
      requirementQualityReport.toLowerCase().includes('risk level: high') ||
      requirementQualityReport.toLowerCase().includes('status: fail');
  
    console.log(
      requirementRiskDetected
        ? '⚠️ Requirement risk detected'
        : '✅ Requirement quality check complete',
    );
  
    return {
      ...inputData,
      requirementQualityReport,
      requirementRiskDetected,
    };
  
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 2: REQUIREMENT BLOCKER / PROCEED DECISION
// ─────────────────────────────────────────────────────────────
const step2RequirementDecision = createStep({
  id: 'step-2-requirement-decision',
  description: 'Creates blocker report when requirement is weak, otherwise proceeds with assumptions for demo flow',
  inputSchema: z.object({
    requirement: z.string(),
    demoFailureMode: z.string(),
    requirementQualityReport: z.string(),
    requirementRiskDetected: z.boolean(),
  }),
  outputSchema: z.object({
    requirement: z.string(),
    demoFailureMode: z.string(),
    requirementQualityReport: z.string(),
    requirementRiskDetected: z.boolean(),
    requirementBlockerReport: z.string(),
    proceedWithAssumptions: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 2: Requirement Decision...');

    if (!inputData.requirementRiskDetected) {
      return {
        ...inputData,
        requirementBlockerReport: 'No requirement blocker. Proceed to Jira creation.',
        proceedWithAssumptions: false,
      };
    }

    const blocker = await blockerAgent.generate([
      {
        role: 'user',
        content: `Requirement quality issue detected. Create blocker / risk report.\n\nRequirement:\n${inputData.requirement}\n\nQuality Report:\n${inputData.requirementQualityReport}`,
      },
    ]);

    // Demo-friendly behavior: continue but mark assumptions.
    // In a real workflow, this is where you would suspend and wait for Product Owner clarification.
    return {
      ...inputData,
      requirementBlockerReport: blocker.text,
      proceedWithAssumptions: true,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 3: JIRA INTAKE
// ─────────────────────────────────────────────────────────────
const step3JiraIntake = createStep({
  id: 'step-3-jira-intake',
  description: 'Jira Agent converts analyzed requirement into a detailed Jira ticket',
  inputSchema: z.object({
    requirement: z.string(),
    demoFailureMode: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    proceedWithAssumptions: z.boolean(),
  }),
  outputSchema: z.object({
    requirement: z.string(),
    demoFailureMode: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    jiraTicket: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 3: Jira Intake...');

    const res = await jiraAgent.generate([
      {
        role: 'user',
        content: `Create a detailed Jira ticket using this analyzed requirement.\n\nRequirement:\n${inputData.requirement}\n\nRequirement Quality Report:\n${inputData.requirementQualityReport}\n\nRequirement Risk / Blocker Report:\n${inputData.requirementBlockerReport}\n\nIf assumptions are present, include them clearly in the Jira ticket.`,
      },
    ]);

    console.log('✅ Jira ticket created');

    return {
      requirement: inputData.requirement,
      demoFailureMode: inputData.demoFailureMode,
      requirementQualityReport: inputData.requirementQualityReport,
      requirementBlockerReport: inputData.requirementBlockerReport,
      jiraTicket: res.text,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 4: CONTRACT-FIRST DESIGN + UI DESIGN IN PARALLEL
// ─────────────────────────────────────────────────────────────
const step4ContractAndDesign = createStep({
  id: 'step-4-contract-and-design',
  description: 'API contract and UI/UX design are generated before development starts',
  inputSchema: z.object({
    requirement: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    jiraTicket: z.string(),
  }),
  outputSchema: z.object({
    requirement: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    jiraTicket: z.string(),
    apiContract: z.string(),
    designSpec: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 4: Contract-first Architecture + UI Design...');

    const [contractRes, designRes] = await Promise.all([
      apiContractAgent.generate([
        {
          role: 'user',
          content: `Create an API contract for this Jira ticket and requirement.\n\nRequirement:\n${inputData.requirement}\n\nJira Ticket:\n${inputData.jiraTicket}`,
        },
      ]),
      figmaAgent.generate([
        {
          role: 'user',
          content: `Create UI/UX design specification for this Jira ticket.\n\nRequirement:\n${inputData.requirement}\n\nJira Ticket:\n${inputData.jiraTicket}`,
        },
      ]),
    ]);

    console.log('✅ API contract and design spec ready');

    return {
      ...inputData,
      apiContract: contractRes.text,
      designSpec: designRes.text,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 5: SPRINT PLANNING
// ─────────────────────────────────────────────────────────────
const step5SprintPlanning = createStep({
  id: 'step-5-sprint-planning',
  description: 'Scrum Master creates sprint plan from Jira, design spec, and API contract',
  inputSchema: z.object({
    requirement: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    jiraTicket: z.string(),
    apiContract: z.string(),
    designSpec: z.string(),
  }),
  outputSchema: z.object({
    requirement: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    jiraTicket: z.string(),
    apiContract: z.string(),
    designSpec: z.string(),
    sprintPlan: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 5: Sprint Planning...');

    const res = await scrumMasterAgent.generate([
      {
        role: 'user',
        content: `Plan sprint execution for this feature.\n\nJira Ticket:\n${inputData.jiraTicket}\n\nAPI Contract:\n${inputData.apiContract}\n\nDesign Spec:\n${inputData.designSpec}`,
      },
    ]);

    console.log('✅ Sprint plan ready');

    return {
      ...inputData,
      sprintPlan: res.text,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 6: DEVOPS INFRASTRUCTURE
// ─────────────────────────────────────────────────────────────
const step6DevOpsInfra = createStep({
  id: 'step-6-devops-infra',
  description: 'DevOps Agent prepares Azure infrastructure, Bicep, Key Vault, App Insights, and CI/CD pipeline',
  inputSchema: z.object({
    requirement: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    jiraTicket: z.string(),
    apiContract: z.string(),
    designSpec: z.string(),
    sprintPlan: z.string(),
  }),
  outputSchema: z.object({
    requirement: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    jiraTicket: z.string(),
    apiContract: z.string(),
    designSpec: z.string(),
    sprintPlan: z.string(),
    infraPlan: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 6: DevOps Infrastructure...');

    const res = await devopsAgent.generate([
      {
        role: 'user',
        content: `Prepare Azure infrastructure and CI/CD pipeline for this feature.\n\nRequirement:\n${inputData.requirement}\n\nAPI Contract:\n${inputData.apiContract}\n\nEnvironment strategy: DEV → QA → UAT → PROD with App Insights, Key Vault, and deployment slot support.`,
      },
    ]);

    console.log('✅ Infrastructure plan ready');

    return {
      ...inputData,
      infraPlan: res.text,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 7: DEVELOPMENT WITH SEPARATION OF CONCERN
// ─────────────────────────────────────────────────────────────
const step7Development = createStep({
  id: 'step-7-development-separated-agents',
  description: 'Development Orchestrator coordinates Database, Backend, Frontend, and Integration Validator agents',
  inputSchema: z.object({
    requirement: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    jiraTicket: z.string(),
    apiContract: z.string(),
    designSpec: z.string(),
    sprintPlan: z.string(),
    infraPlan: z.string(),
  }),
  outputSchema: z.object({
    requirement: z.string(),
    requirementQualityReport: z.string(),
    requirementBlockerReport: z.string(),
    jiraTicket: z.string(),
    apiContract: z.string(),
    designSpec: z.string(),
    sprintPlan: z.string(),
    infraPlan: z.string(),
    databaseCode: z.string(),
    backendCode: z.string(),
    frontendCode: z.string(),
    integrationValidationReport: z.string(),
    generatedCode: z.string(),
    developmentReport: z.string(),
    developmentBlocked: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 7: Development with separated agents...');

    const commonContext = `
Requirement:
${inputData.requirement}

Requirement Quality Report:
${inputData.requirementQualityReport}

Jira Ticket:
${inputData.jiraTicket}

API Contract:
${inputData.apiContract}

Design Spec:
${inputData.designSpec}

Sprint Plan:
${inputData.sprintPlan}
`;

    const databaseRes = await databaseAgent.generate([
      {
        role: 'user',
        content: `Generate SQL Server database artifacts only.\n\n${commonContext}`,
      },
    ]);

    const backendRes = await backendAgent.generate([
      {
        role: 'user',
        content: `Generate .NET Core 8 backend artifacts only.\n\nDatabase artifacts:\n${databaseRes.text}\n\n${commonContext}`,
      },
    ]);

    const frontendRes = await frontendAgent.generate([
      {
        role: 'user',
        content: `Generate React TypeScript frontend artifacts only.\n\nBackend/API contract details:\n${backendRes.text}\n\n${commonContext}`,
      },
    ]);

    const validationRes = await integrationValidatorAgent.generate([
      {
        role: 'user',
        content: `Validate consistency across these artifacts.\n\nAPI Contract:\n${inputData.apiContract}\n\nDatabase:\n${databaseRes.text}\n\nBackend:\n${backendRes.text}\n\nFrontend:\n${frontendRes.text}`,
      },
    ]);

    const developmentBlocked = validationRes.text.toLowerCase().includes('fail');

    const orchestrationRes = await devAgent.generate([
      {
        role: 'user',
        content: `Create development orchestration summary and PR readiness report.\n\nJira Ticket:\n${inputData.jiraTicket}\n\nDatabase Agent Output:\n${getSafePreview(databaseRes.text)}\n\nBackend Agent Output:\n${getSafePreview(backendRes.text)}\n\nFrontend Agent Output:\n${getSafePreview(frontendRes.text)}\n\nIntegration Validation Report:\n${validationRes.text}\n\nIf integration validation failed, do not mark PR as ready.`,
      },
    ]);

    const generatedCode = `
# FULL STACK DEVELOPMENT OUTPUT

## Database Agent Output
${databaseRes.text}

---

## Backend Agent Output
${backendRes.text}

---

## Frontend Agent Output
${frontendRes.text}

---

## Integration Validation Report
${validationRes.text}

---

## Development Orchestration Report
${orchestrationRes.text}
`;

    console.log(developmentBlocked ? '⚠️ Development validation failed' : '✅ Development completed with separation of concern');

    return {
      ...inputData,
      databaseCode: databaseRes.text,
      backendCode: backendRes.text,
      frontendCode: frontendRes.text,
      integrationValidationReport: validationRes.text,
      generatedCode,
      developmentReport: orchestrationRes.text,
      developmentBlocked,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 8: POST-DEV QUALITY GATE
// ─────────────────────────────────────────────────────────────
const step8PostDevQuality = createStep({
  id: 'step-8-post-dev-quality',
  description: 'QA Agent performs code review, security, performance, accessibility, and test planning review before QA deployment',
  inputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    apiContract: z.string(),
    infraPlan: z.string(),
    generatedCode: z.string(),
    integrationValidationReport: z.string(),
    developmentReport: z.string(),
    developmentBlocked: z.boolean(),
  }).passthrough(),
  outputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    apiContract: z.string(),
    infraPlan: z.string(),
    generatedCode: z.string(),
    integrationValidationReport: z.string(),
    developmentReport: z.string(),
    developmentBlocked: z.boolean(),
    postDevQualityReport: z.string(),
    postDevBlocked: z.boolean(),
  }).passthrough(),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 8: Post-development Quality Gate...');

    if (inputData.developmentBlocked) {
      const blocker = await blockerAgent.generate([
        {
          role: 'user',
          content: `Development integration validation failed. Create blocker report.\n\nValidation Report:\n${inputData.integrationValidationReport}`,
        },
      ]);

      return {
        ...inputData,
        postDevQualityReport: blocker.text,
        postDevBlocked: true,
      };
    }

    const res = await qaAgent.generate([
      {
        role: 'user',
        content: `Run post-development quality review before QA deployment.\n\nCheck code review, security, performance, documentation readiness, test readiness.\n\nJira Ticket:\n${inputData.jiraTicket}\n\nGenerated Code Preview:\n${getSafePreview(inputData.generatedCode, 2000)}`,
      },
    ]);

    const postDevBlocked = isFailureText(res.text);

    return {
      ...inputData,
      postDevQualityReport: res.text,
      postDevBlocked,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 9: QA TESTING
// ─────────────────────────────────────────────────────────────
const step9QATesting = createStep({
  id: 'step-9-qa-testing',
  description: 'QA Agent runs Playwright, xUnit, API integration, OWASP, accessibility, and chaos testing',
  inputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    generatedCode: z.string(),
    postDevQualityReport: z.string(),
    postDevBlocked: z.boolean(),
  }).passthrough(),
  outputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    generatedCode: z.string(),
    postDevQualityReport: z.string(),
    postDevBlocked: z.boolean(),
    qaReport: z.string(),
    qaBlocked: z.boolean(),
  }).passthrough(),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 9: QA Testing...');

    if (inputData.postDevBlocked) {
      const blocker = await blockerAgent.generate([
        {
          role: 'user',
          content: `Post-development quality gate failed. Create blocker report.\n\nQuality Report:\n${inputData.postDevQualityReport}`,
        },
      ]);

      return {
        ...inputData,
        qaReport: blocker.text,
        qaBlocked: true,
      };
    }

    const res = await qaAgent.generate([
      {
        role: 'user',
        content: `Run full QA suite for this feature.\n\nJira Ticket:\n${inputData.jiraTicket}\n\nGenerated Code Preview:\n${getSafePreview(inputData.generatedCode, 2000)}\n\nRun: Playwright E2E, xUnit, API integration tests, OWASP, Accessibility, Chaos tests.`,
      },
    ]);

    const qaBlocked = isFailureText(res.text);

    console.log(qaBlocked ? '⚠️ QA issues detected' : '✅ QA testing complete');

    return {
      ...inputData,
      qaReport: res.text,
      qaBlocked,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 10: UAT HEALTH CHECK + DEPLOYMENT
// ─────────────────────────────────────────────────────────────
const step10UATDeploy = createStep({
  id: 'step-10-uat-deploy',
  description: 'Checks UAT health and deploys to UAT only if QA is clear',
  inputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    qaReport: z.string(),
    qaBlocked: z.boolean(),
  }).passthrough(),
  outputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    qaReport: z.string(),
    qaBlocked: z.boolean(),
    uatHealthReport: z.string(),
    uatDeployReport: z.string(),
    uatBlocked: z.boolean(),
  }).passthrough(),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 10: UAT Health Check + Deployment...');

    if (inputData.qaBlocked) {
      const blocker = await blockerAgent.generate([
        {
          role: 'user',
          content: `QA failed. Create blocker report and stop UAT deployment.\n\nQA Report:\n${inputData.qaReport}`,
        },
      ]);

      return {
        ...inputData,
        uatHealthReport: 'Skipped because QA failed.',
        uatDeployReport: blocker.text,
        uatBlocked: true,
      };
    }

    const healthRes = await azureHealthAgent.generate([
      {
        role: 'user',
        content: 'Run full UAT environment health check. Check App Service, API ping, SQL Server connectivity, App Insights error rate, and availability.',
      },
    ]);

    const uatHealthFailed = isFailureText(healthRes.text);

    if (uatHealthFailed) {
      const blocker = await blockerAgent.generate([
        {
          role: 'user',
          content: `UAT health check failed. Create blocker report.\n\nHealth Report:\n${healthRes.text}`,
        },
      ]);

      return {
        ...inputData,
        uatHealthReport: healthRes.text,
        uatDeployReport: blocker.text,
        uatBlocked: true,
      };
    }

    const deployRes = await deployAgent.generate([
      {
        role: 'user',
        content: `Deploy to UAT environment.\n\nRequirement:\n${inputData.requirement}\n\nQA Report:\n${getSafePreview(inputData.qaReport)}`,
      },
    ]);

    const uatBlocked = isFailureText(deployRes.text);

    return {
      ...inputData,
      uatHealthReport: healthRes.text,
      uatDeployReport: deployRes.text,
      uatBlocked,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 11: PRODUCTION HEALTH CHECK + DEPLOYMENT
// ─────────────────────────────────────────────────────────────
const step11ProdDeploy = createStep({
  id: 'step-11-prod-deploy',
  description: 'Checks production health and performs production deployment using zero-downtime slot swap',
  inputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    uatDeployReport: z.string(),
    uatBlocked: z.boolean(),
  }).passthrough(),
  outputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    uatDeployReport: z.string(),
    uatBlocked: z.boolean(),
    prodHealthReport: z.string(),
    prodDeployReport: z.string(),
    prodBlocked: z.boolean(),
  }).passthrough(),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 11: Production Health Check + Deployment...');

    if (inputData.uatBlocked) {
      const blocker = await blockerAgent.generate([
        {
          role: 'user',
          content: `UAT deployment blocked. Create production stop report.\n\nUAT Deploy Report:\n${inputData.uatDeployReport}`,
        },
      ]);

      return {
        ...inputData,
        prodHealthReport: 'Skipped because UAT is blocked.',
        prodDeployReport: blocker.text,
        prodBlocked: true,
      };
    }

    const healthRes = await azureHealthAgent.generate([
      {
        role: 'user',
        content: 'Run full production pre-deployment health check. Check App Service, API ping, SQL Server connectivity, App Insights errors, performance, availability, and rollback readiness.',
      },
    ]);

    const prodHealthFailed = isFailureText(healthRes.text);

    if (prodHealthFailed) {
      const blocker = await blockerAgent.generate([
        {
          role: 'user',
          content: `Production health check failed. Create blocker report.\n\nHealth Report:\n${healthRes.text}`,
        },
      ]);

      return {
        ...inputData,
        prodHealthReport: healthRes.text,
        prodDeployReport: blocker.text,
        prodBlocked: true,
      };
    }

    const deployRes = await deployAgent.generate([
      {
        role: 'user',
        content: `Deploy to production using zero-downtime slot swap.\n\nRequirement:\n${inputData.requirement}\n\nUAT Report:\n${getSafePreview(inputData.uatDeployReport)}`,
      },
    ]);

    const prodBlocked = isFailureText(deployRes.text);

    return {
      ...inputData,
      prodHealthReport: healthRes.text,
      prodDeployReport: deployRes.text,
      prodBlocked,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 12: POST-PRODUCTION PARALLEL
// ─────────────────────────────────────────────────────────────
const step12PostProduction = createStep({
  id: 'step-12-post-production',
  description: 'Monitoring, release notes, documentation, and rollback watch run after production deployment',
  inputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    prodDeployReport: z.string(),
    prodBlocked: z.boolean(),
  }).passthrough(),
  outputSchema: z.object({
    requirement: z.string(),
    jiraTicket: z.string(),
    prodDeployReport: z.string(),
    prodBlocked: z.boolean(),
    monitoringReport: z.string(),
    releaseNotes: z.string(),
    documentation: z.string(),
  }).passthrough(),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 12: Post-production parallel work...');

    if (inputData.prodBlocked) {
      return {
        ...inputData,
        monitoringReport: 'Skipped because production deployment is blocked.',
        releaseNotes: 'Draft release notes only. Production did not complete.',
        documentation: 'Draft documentation only. Production did not complete.',
      };
    }

    const [monitoringRes, releaseRes, documentationRes] = await Promise.all([
      monitoringAgent.generate([
        {
          role: 'user',
          content: `Monitor production for 30 minutes after deployment.\n\nRequirement:\n${inputData.requirement}\n\nProduction Deploy Report:\n${inputData.prodDeployReport}`,
        },
      ]),
      releaseNotesAgent.generate([
        {
          role: 'user',
          content: `Generate release notes for this Jira ticket and deployment.\n\nJira Ticket:\n${inputData.jiraTicket}`,
        },
      ]),
      documentationAgent.generate([
        {
          role: 'user',
          content: `Generate API docs, component docs, ADR, README update, and runbook for this feature.\n\nRequirement:\n${inputData.requirement}`,
        },
      ]),
    ]);

    return {
      ...inputData,
      monitoringReport: monitoringRes.text,
      releaseNotes: releaseRes.text,
      documentation: documentationRes.text,
    };
  },
});
const step13Scoring = createStep({
  id: 'step-13-sdlc-scoring',
  description: 'Scores generated SDLC artifacts and delivery readiness',
  inputSchema: z.object({}).passthrough(),
  outputSchema: z.object({}).passthrough(),
  execute: async ({ inputData }) => {
    console.log('\nPHASE 13: SDLC Scoring...');

    const data = inputData as any;

    const scores = [
      scoreRequirementQuality(asString(data.requirementQualityReport)),
      scoreApiContract(asString(data.apiContract)),
      scoreDevelopmentSeparation(
        asString(data.databaseCode),
        asString(data.backendCode),
        asString(data.frontendCode),
      ),
      scoreIntegrationValidation(asString(data.integrationValidationReport)),
      scoreQaReadiness(asString(data.qaReport)),
      scoreDeploymentReadiness(
        Boolean(data.uatBlocked),
        Boolean(data.prodBlocked),
      ),
    ];

    const sdlcScoreReport = buildScoreReport(scores);

    return {
      ...data,
      sdlcScores: scores,
      sdlcScoreReport,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// STEP 14: FINAL COMMAND CENTER SUMMARY
// ─────────────────────────────────────────────────────────────
const step14Summary = createStep({
  id: 'step-14-command-center-summary',
  description:
    'Generates final command center dashboard summary with lifecycle status, gates, blockers, scores, and artifacts',
  inputSchema: z
    .object({
      requirement: z.string(),
      requirementQualityReport: z.string(),
      demoFailureMode: z.string(),
      requirementBlockerReport: z.string(),
      userId: z.string(),
guardrailReport: z.string(),
guardrailBlocked: z.boolean(),
memorySummary: z.string(),
      jiraTicket: z.string(),
      apiContract: z.string(),
      designSpec: z.string(),
      sprintPlan: z.string(),
      infraPlan: z.string(),
      generatedCode: z.string(),
      integrationValidationReport: z.string(),
      developmentReport: z.string(),
      postDevQualityReport: z.string(),
      qaReport: z.string(),
      uatHealthReport: z.string(),
      uatDeployReport: z.string(),
      prodHealthReport: z.string(),
      prodDeployReport: z.string(),
      monitoringReport: z.string(),
      releaseNotes: z.string(),
      documentation: z.string(),
      developmentBlocked: z.boolean(),
      postDevBlocked: z.boolean(),
      qaBlocked: z.boolean(),
      uatBlocked: z.boolean(),
      prodBlocked: z.boolean(),
      sdlcScoreReport: z.string().optional(),
      sdlcScores: z.any().optional(),
    })
    .passthrough(),
  outputSchema: z.object({
    summary: z.string(),
    releaseNotes: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log('\nGenerating Command Center summary...');
  
    const productionLive = !inputData.prodBlocked;
  
    const blockerCount = [
      inputData.developmentBlocked,
      inputData.postDevBlocked,
      inputData.qaBlocked,
      inputData.uatBlocked,
      inputData.prodBlocked,
      inputData.guardrailBlocked,
    ].filter(Boolean).length;
  
    const overallScoreMatch = String(inputData.sdlcScoreReport ?? '').match(
      /Overall SDLC Confidence Score\s*\n(\d+)/i,
    );
  
    const overallScore = overallScoreMatch
      ? Number(overallScoreMatch[1])
      : undefined;
  
    await appendSdlcMemory({
      runId: `run-${Date.now()}`,
      userId: inputData.userId ?? 'demo-user',
      requirement: inputData.requirement,
      demoFailureMode: inputData.demoFailureMode ?? 'none',
      status: productionLive ? 'PRODUCTION LIVE' : 'BLOCKED BEFORE PRODUCTION',
      blockerCount,
      overallScore,
      createdAtUtc: new Date().toISOString(),
    });
  
    const summary = `
  # SDLC COMMAND CENTER — V2 LIFECYCLE COMPLETE
  
  ## Guardrails
  ${inputData.guardrailReport ?? 'Guardrail report not available.'}
  
  ## Memory
  ${inputData.memorySummary ?? 'Memory summary not available.'}
  
  ## Feature
  ${inputData.requirement}
  
  ## Overall Status
  ${productionLive ? '✅ PRODUCTION LIVE' : '🚨 BLOCKED BEFORE PRODUCTION'}
  
  ## Blockers
  Active blocker count: ${blockerCount}
  
  ## Lifecycle Status
  | Phase | Agent | Status |
  |---|---|---|
  | Guardrails + Memory | Local Guardrail + Memory | ${inputData.guardrailBlocked ? '🚨 Blocked' : '✅ Passed'} |
  | Requirement Quality | Requirement Analyzer | ✅ Done |
  | Jira Intake | Jira Agent | ✅ Done |
  | API Contract | API Contract Agent | ✅ Done |
  | UI/UX Design | Figma Agent | ✅ Done |
  | Sprint Planning | Scrum Master Agent | ✅ Done |
  | Infrastructure | DevOps Agent | ✅ Done |
  | Database | Database Agent | ${inputData.developmentBlocked ? '⚠️ Check Required' : '✅ Done'} |
  | Backend | Backend Agent | ${inputData.developmentBlocked ? '⚠️ Check Required' : '✅ Done'} |
  | Frontend | Frontend Agent | ${inputData.developmentBlocked ? '⚠️ Check Required' : '✅ Done'} |
  | Integration Validation | Integration Validator | ${inputData.developmentBlocked ? '🚨 Failed' : '✅ Passed'} |
  | Post-dev Quality | QA Agent | ${inputData.postDevBlocked ? '🚨 Failed' : '✅ Passed'} |
  | QA Testing | QA Agent | ${inputData.qaBlocked ? '🚨 Failed' : '✅ Passed'} |
  | UAT Health + Deploy | Azure Health + Deploy Agent | ${inputData.uatBlocked ? '🚨 Blocked' : '✅ Done'} |
  | Production Health + Deploy | Azure Health + Deploy Agent | ${inputData.prodBlocked ? '🚨 Blocked' : '✅ Done'} |
  | Monitoring | Monitoring Agent | ${productionLive ? '✅ Done' : '⏭️ Skipped'} |
  | Release Notes | Release Notes Agent | ✅ Done |
  | Documentation | Documentation Agent | ✅ Done |
  
  ## SDLC Scoring
  ${inputData.sdlcScoreReport ?? 'Scoring report not available.'}
  
  ## Human Approval Gates
  | Gate | Approver | Demo Status |
  |---|---|---|
  | Gate 1 | Product Owner | Simulated approval after requirement quality |
  | Gate 2 | Tech Lead | Simulated approval after API contract + sprint plan |
  | Gate 3 | Tech Lead | Simulated approval after post-dev quality |
  | Gate 4 | QA Lead | Simulated approval after QA testing |
  | Gate 5 | PM / Business | Simulated approval after UAT |
  | Gate 6 | PM + DevOps | Simulated approval for production go-live |
  
  ## Key Artifacts
  - Guardrail Report: created
  - Memory Summary: loaded
  - Requirement Quality Report: created
  - Jira Ticket: created
  - API Contract: created
  - Design Spec: created
  - Sprint Plan: created
  - Infrastructure Plan: created
  - DB / Backend / Frontend Artifacts: created separately
  - Integration Validation Report: created
  - QA Report: created
  - SDLC Scoring Report: created
  - Release Notes: created
  - Documentation: created
  
  ## Production URL
  ${productionLive ? 'https://your-app.azurewebsites.net' : 'Not available because production deployment was blocked.'}
  
  ## Architecture Improvement
  This V2 workflow avoids the God Agent problem. Development is separated into Database Agent, Backend Agent, Frontend Agent, and Integration Validator Agent. The Dev Agent acts as an orchestrator instead of generating everything directly.
  `;
  
    return {
      summary,
      releaseNotes: inputData.releaseNotes,
    };
  },
});
// ─────────────────────────────────────────────────────────────
// MAIN SDLC WORKFLOW — V2
// ─────────────────────────────────────────────────────────────
export const sdlcWorkflow = createWorkflow({
  id: 'sdlc-workflow',
  description:
    'Agentic SDLC V2: guardrails, memory, requirement quality, contract-first design, separated development agents, validation, blockers, scoring, deployment, and monitoring',
  inputSchema: requirementInput,
  outputSchema: z.object({
    summary: z.string(),
    releaseNotes: z.string(),
  }),
})
  .then(step0GuardrailsAndMemory as any)
  .then(step1RequirementQuality as any)
  .then(step2RequirementDecision as any)
  .then(step3JiraIntake as any)
  .then(step4ContractAndDesign as any)
  .then(step5SprintPlanning as any)
  .then(step6DevOpsInfra as any)
  .then(step7Development as any)
  .then(step8PostDevQuality as any)
  .then(step9QATesting as any)
  .then(step10UATDeploy as any)
  .then(step11ProdDeploy as any)
  .then(step12PostProduction as any)
  .then(step13Scoring as any)
  .then(step14Summary as any)
  .commit();