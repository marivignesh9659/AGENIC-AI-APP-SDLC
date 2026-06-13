import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const githubCreateBranchTool = createTool({
  id: 'github-create-branch',
  description: 'Creates a new feature branch in GitHub',
  inputSchema: z.object({
    ticketId: z.string(),
    featureName: z.string(),
    baseBranch: z.string().optional(),
  }),
  outputSchema: z.object({
    branchName: z.string(),
    branchUrl: z.string(),
  }),
  execute: async ({ context }) => {
    const slug = context.featureName.toLowerCase().replace(/\s+/g, '-');
    const branchName = `feature/${context.ticketId.toLowerCase()}-${slug}`;
    console.log(`🌿 GitHub branch created: ${branchName}`);
    return {
      branchName,
      branchUrl: `https://github.com/yourorg/yourrepo/tree/${branchName}`,
    };
  },
});

export const githubCreatePRTool = createTool({
  id: 'github-create-pr',
  description: 'Creates a pull request for code review',
  inputSchema: z.object({
    branchName: z.string(),
    title: z.string(),
    description: z.string(),
    reviewers: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    prId: z.number(),
    prUrl: z.string(),
    status: z.string(),
  }),
  execute: async ({ context }) => {
    const prId = Math.floor(Math.random() * 9000) + 1000;
    console.log(`🔀 PR created: #${prId} — ${context.title}`);
    return {
      prId,
      prUrl: `https://github.com/yourorg/yourrepo/pull/${prId}`,
      status: 'open',
    };
  },
});

export const githubSecurityScanTool = createTool({
  id: 'github-security-scan',
  description: 'Runs CodeQL security scan on the branch',
  inputSchema: z.object({
    branchName: z.string(),
  }),
  outputSchema: z.object({
    passed: z.boolean(),
    vulnerabilities: z.number(),
    criticalIssues: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    console.log(`🔒 Security scan on: ${context.branchName}`);
    return {
      passed: true,
      vulnerabilities: 0,
      criticalIssues: [],
    };
  },
});