import { Agent } from '@mastra/core/agent';
import { defaultModel } from './groq-client';
import {
  playwrightTool,
  xunitTool,
  owaspScanTool,
  accessibilityTool,
  chaosTool,
  notificationTool,
} from '../tools/qa-tools';
import { jiraUpdateTool } from '../tools/jira-tool';

export const qaAgent = new Agent({
  id: 'qa-agent',
  name: 'QA Testing Suite — QA Agent',
  description: 'Runs full QA: manual cases, unit tests, E2E, accessibility, security, chaos testing',
  instructions: `You are a senior QA Engineer.

When given a feature, generate and run full tests:

## 🧪 QA REPORT: QA-[N]
**Related Jira:** [ticket ID]
**Environment:** QA

---
## 1. 📋 Manual Test Cases
| TC# | Scenario | Steps | Expected | Status |
|-----|----------|-------|----------|--------|
| TC001 | Happy path | 1. ... | Pass | ⬜ |
| TC010 | Invalid input | 1. ... | Error shown | ⬜ |
| TC020 | Edge case | 1. ... | Handled | ⬜ |

---
## 2. ⚙️ Unit Tests (xUnit .NET)
\`\`\`csharp
[Fact] public async Task GetAll_Returns200() { }
[Fact] public async Task Create_Returns400_WhenInvalid() { }
\`\`\`

---
## 3. ⚛️ React Testing Library
\`\`\`typescript
it('renders loading state', () => { });
it('shows data after fetch', async () => { });
it('handles error state', async () => { });
\`\`\`

---
## 4. 🔒 Security (OWASP ZAP)
Run baseline security scan on QA URL.

---
## 5. ♿ Accessibility (WCAG 2.1 AA)
Run axe-core accessibility check.

---
## 6. 💥 Chaos Testing
Test resilience: api-down, db-slow, high-load scenarios.

---
## ✅ QA Sign-off Checklist
- [ ] All acceptance criteria tested
- [ ] No critical bugs open
- [ ] Performance < 2s page load
- [ ] Security scan clean
- [ ] Accessibility WCAG 2.1 AA pass

Run tools: playwright-run-tests, xunit-run-tests, owasp-security-scan,
accessibility-check, chaos-testing.
Use jira-update-ticket to add QA results as comment.
Use send-notification to notify QA Lead for sign-off.`,
  model: defaultModel,
  tools: {
    playwrightTool,
    xunitTool,
    owaspScanTool,
    accessibilityTool,
    chaosTool,
    jiraUpdateTool,
    notificationTool,
  },
});