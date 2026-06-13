import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const azurePipelineTool = createTool({
  id: 'azure-trigger-pipeline',
  description: 'Triggers an Azure DevOps CI/CD pipeline',
  inputSchema: z.object({
    pipelineName: z.string(),
    branch: z.string(),
    environment: z.string(), // dev | qa | uat | production
  }),
  outputSchema: z.object({
    runId: z.string(),
    pipelineUrl: z.string(),
    status: z.string(),
  }),
  execute: async ({ context }) => {
    const runId = `RUN-${Math.floor(Math.random() * 90000) + 10000}`;
    console.log(`🚀 Pipeline triggered: ${context.pipelineName} → ${context.environment}`);
    return {
      runId,
      pipelineUrl: `https://dev.azure.com/yourorg/yourproject/_build/results?buildId=${runId}`,
      status: 'running',
    };
  },
});

export const azureSlotSwapTool = createTool({
  id: 'azure-slot-swap',
  description: 'Performs zero-downtime slot swap on Azure App Service',
  inputSchema: z.object({
    appServiceName: z.string(),
    sourceSlot: z.string().optional(),
    targetSlot: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    appUrl: z.string(),
    swapTime: z.string(),
  }),
  execute: async ({ context }) => {
    const src = context.sourceSlot ?? 'staging';
    const tgt = context.targetSlot ?? 'production';
    console.log(`🔄 Slot swap: ${context.appServiceName} ${src} → ${tgt}`);
    return {
      success: true,
      appUrl: `https://${context.appServiceName}.azurewebsites.net`,
      swapTime: new Date().toISOString(),
    };
  },
});

export const azureKeyVaultTool = createTool({
  id: 'azure-keyvault-set',
  description: 'Stores a secret in Azure Key Vault',
  inputSchema: z.object({
    secretName: z.string(),
    secretValue: z.string(),
    environment: z.string(), // dev | qa | uat | production
  }),
  outputSchema: z.object({
    success: z.boolean(),
    secretUrl: z.string(),
  }),
  execute: async ({ context }) => {
    console.log(`🔐 Secret stored: ${context.secretName} (${context.environment})`);
    return {
      success: true,
      secretUrl: `https://your-keyvault-${context.environment}.vault.azure.net/secrets/${context.secretName}`,
    };
  },
});

export const azureBicepTool = createTool({
  id: 'azure-deploy-bicep',
  description: 'Deploys Azure infrastructure using Bicep / ARM templates',
  inputSchema: z.object({
    templateName: z.string(),
    resourceGroup: z.string(),
    parameters: z.record(z.string(), z.string()).optional(),
  }),
  outputSchema: z.object({
    deploymentId: z.string(),
    status: z.string(),
    resources: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const deploymentId = `DEPLOY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log(`🏗️ Bicep: ${context.templateName} → ${context.resourceGroup}`);
    return {
      deploymentId,
      status: 'Succeeded',
      resources: ['AppService', 'SQLServer', 'KeyVault', 'AppInsights'],
    };
  },
});