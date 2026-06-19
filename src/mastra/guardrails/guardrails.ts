export type GuardrailStatus = 'PASS' | 'BLOCKED';

export type GuardrailResult = {
  status: GuardrailStatus;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  owner: 'Product Owner' | 'Security' | 'Tech Lead' | 'PM';
  reason: string;
  action: string;
};

const containsAny = (value: string, keywords: string[]) => {
  const lower = value.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
};

export const runRequirementGuardrails = (
  requirement: string,
): GuardrailResult => {
  const trimmed = requirement.trim();

  if (!trimmed) {
    return {
      status: 'BLOCKED',
      severity: 'HIGH',
      owner: 'Product Owner',
      reason: 'Requirement is empty.',
      action: 'Product Owner must provide a valid business requirement.',
    };
  }

  if (trimmed.length < 20) {
    return {
      status: 'BLOCKED',
      severity: 'HIGH',
      owner: 'Product Owner',
      reason: 'Requirement is too short and vague.',
      action:
        'Product Owner must clarify business goal, users, screens, APIs, data, and acceptance criteria.',
    };
  }

  if (
    containsAny(trimmed, [
      'ignore previous instructions',
      'bypass guardrails',
      'jailbreak',
      'disable safety',
      'reveal system prompt',
    ])
  ) {
    return {
      status: 'BLOCKED',
      severity: 'CRITICAL',
      owner: 'Security',
      reason: 'Prompt injection or policy bypass attempt detected.',
      action: 'Security review required before continuing.',
    };
  }

  if (
    containsAny(trimmed, [
      'steal password',
      'dump secrets',
      'exfiltrate',
      'leak api key',
      'malware',
      'ransomware',
    ])
  ) {
    return {
      status: 'BLOCKED',
      severity: 'CRITICAL',
      owner: 'Security',
      reason: 'Unsafe or malicious software request detected.',
      action: 'Stop workflow and route to Security.',
    };
  }

  if (
    !containsAny(trimmed, [
      'create',
      'build',
      'develop',
      'module',
      'feature',
      'api',
      'frontend',
      'backend',
      'database',
      'portal',
      'application',
    ])
  ) {
    return {
      status: 'BLOCKED',
      severity: 'MEDIUM',
      owner: 'PM',
      reason: 'Input does not look like an SDLC software delivery request.',
      action: 'PM should confirm whether this belongs in SDLC workflow.',
    };
  }

  return {
    status: 'PASS',
    severity: 'LOW',
    owner: 'PM',
    reason: 'Requirement passed initial SDLC guardrails.',
    action: 'Proceed to requirement analysis.',
  };
};

export const buildGuardrailReport = (result: GuardrailResult) => {
  return `
# SDLC GUARDRAIL REPORT

## Status
${result.status}

## Severity
${result.severity}

## Owner
${result.owner}

## Reason
${result.reason}

## Action
${result.action}
`;
};