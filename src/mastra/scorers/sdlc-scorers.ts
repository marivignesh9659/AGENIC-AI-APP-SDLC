export type ScoreResult = {
    name: string;
    score: number;
    status: 'PASS' | 'WARN' | 'FAIL';
    reason: string;
  };
  
  const clampScore = (score: number) => Math.max(0, Math.min(100, score));
  
  const containsAny = (text: string, keywords: string[]) => {
    const lower = text.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
  };
  
  const getStatus = (score: number): 'PASS' | 'WARN' | 'FAIL' => {
    if (score >= 80) return 'PASS';
    if (score >= 60) return 'WARN';
    return 'FAIL';
  };
  
  export const scoreRequirementQuality = (
    requirementQualityReport: string,
  ): ScoreResult => {
    let score = 100;
  
    if (containsAny(requirementQualityReport, ['STATUS: FAIL', 'HIGH'])) {
      score -= 35;
    }
  
    if (
      containsAny(requirementQualityReport, [
        'missing information',
        'assumption',
        'unclear',
        'needs clarification',
      ])
    ) {
      score -= 15;
    }
  
    const finalScore = clampScore(score);
  
    return {
      name: 'Requirement Quality Score',
      score: finalScore,
      status: getStatus(finalScore),
      reason:
        finalScore >= 80
          ? 'Requirement is clear enough to proceed.'
          : 'Requirement has gaps or needs Product Owner clarification.',
    };
  };
  
  export const scoreApiContract = (apiContract: string): ScoreResult => {
    let score = 0;
  
    if (containsAny(apiContract, ['GET', 'POST', 'PUT', 'DELETE'])) score += 25;
    if (containsAny(apiContract, ['Request DTO', 'Request DTOs'])) score += 20;
    if (containsAny(apiContract, ['Response DTO', 'Response DTOs'])) score += 20;
    if (containsAny(apiContract, ['Validation Rules'])) score += 15;
    if (containsAny(apiContract, ['Authorization Rules', 'Admin'])) score += 15;
    if (containsAny(apiContract, ['Error Response'])) score += 5;
  
    const finalScore = clampScore(score);
  
    return {
      name: 'API Contract Score',
      score: finalScore,
      status: getStatus(finalScore),
      reason:
        finalScore >= 80
          ? 'API contract includes routes, DTOs, validation, authorization, and errors.'
          : 'API contract is missing important implementation details.',
    };
  };
  
  export const scoreDevelopmentSeparation = (
    databaseCode: string,
    backendCode: string,
    frontendCode: string,
  ): ScoreResult => {
    let score = 100;
  
    if (containsAny(databaseCode, ['class ', 'interface ', 'React', 'tsx'])) {
      score -= 25;
    }
  
    if (containsAny(backendCode, ['CREATE TABLE', 'CREATE PROCEDURE', 'tsx'])) {
      score -= 25;
    }
  
    if (containsAny(frontendCode, ['CREATE TABLE', 'Controller', 'Repository'])) {
      score -= 25;
    }
  
    const finalScore = clampScore(score);
  
    return {
      name: 'Development Separation Score',
      score: finalScore,
      status: getStatus(finalScore),
      reason:
        finalScore >= 80
          ? 'Database, backend, and frontend responsibilities are separated.'
          : 'Some generated artifacts appear to mix responsibilities.',
    };
  };
  
  export const scoreIntegrationValidation = (
    integrationValidationReport: string,
  ): ScoreResult => {
    const failed = containsAny(integrationValidationReport, [
      'STATUS: FAIL',
      'FAIL',
      'mismatch',
      'Required Fixes',
    ]);
  
    const score = failed ? 45 : 95;
  
    return {
      name: 'Integration Validation Score',
      score,
      status: getStatus(score),
      reason: failed
        ? 'Integration mismatch detected between DB, backend, frontend, or API contract.'
        : 'Integration validation passed across DB, backend, frontend, and API contract.',
    };
  };
  
  export const scoreQaReadiness = (qaReport: string): ScoreResult => {
    const failed = containsAny(qaReport, [
      'STATUS: FAIL',
      'failed',
      'defect',
      '500',
      'STOP',
    ]);
  
    const score = failed ? 40 : 90;
  
    return {
      name: 'QA Readiness Score',
      score,
      status: getStatus(score),
      reason: failed
        ? 'QA failure detected. Route to QA Lead and Dev Team.'
        : 'QA output indicates tests are acceptable for demo flow.',
    };
  };
  
  export const scoreDeploymentReadiness = (
    uatBlocked: boolean,
    prodBlocked: boolean,
  ): ScoreResult => {
    let score = 100;
  
    if (uatBlocked) score -= 35;
    if (prodBlocked) score -= 45;
  
    const finalScore = clampScore(score);
  
    return {
      name: 'Deployment Readiness Score',
      score: finalScore,
      status: getStatus(finalScore),
      reason:
        finalScore >= 80
          ? 'UAT and production deployment path is healthy.'
          : 'Deployment risk detected. Route to DevOps / PM depending on phase.',
    };
  };
  
  export const calculateOverallScore = (scores: ScoreResult[]) => {
    if (scores.length === 0) return 0;
  
    const total = scores.reduce((sum, item) => sum + item.score, 0);
    return Math.round(total / scores.length);
  };
  
  export const buildScoreReport = (scores: ScoreResult[]) => {
    const overallScore = calculateOverallScore(scores);
    const overallStatus = getStatus(overallScore);
  
    const rows = scores
      .map(
        (item) =>
          `| ${item.name} | ${item.score} | ${item.status} | ${item.reason} |`,
      )
      .join('\n');
  
    return `
  # SDLC SCORER REPORT
  
  ## Overall SDLC Confidence Score
  ${overallScore} / 100
  
  ## Overall Status
  ${overallStatus}
  
  ## Score Breakdown
  | Scorer | Score | Status | Reason |
  |---|---:|---|---|
  ${rows}
  
  ## Recommendation
  ${
    overallScore >= 80
      ? 'Proceed. SDLC artifacts are demo-ready.'
      : overallScore >= 60
        ? 'Proceed with caution. Review warning areas before demo.'
        : 'Stop. Critical quality or delivery risk exists.'
  }
  `;
  };