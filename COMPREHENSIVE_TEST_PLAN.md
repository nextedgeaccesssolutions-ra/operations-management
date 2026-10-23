# NEAS Operations Management System - Comprehensive Test Plan

**Version:** 1.0.0  
**Date:** 23 October 2026  
**Status:** Ready for Execution  
**Test Coverage Target:** 80%+  

---

## 1. TESTING STRATEGY

### 1.1 Test Levels

**Level 1: Unit Tests**
- Individual functions and components
- Business logic validation
- Data transformation tests
- Utility function tests

**Level 2: Integration Tests**
- Service layer integration
- API integration testing
- Database operations
- External service mocks

**Level 3: End-to-End Tests**
- Complete user workflows
- Multi-module interactions
- Data persistence verification
- Authentication flows

**Level 4: Performance Tests**
- Load time measurement
- Memory usage tracking
- Bundle size analysis
- Runtime performance

**Level 5: Security Tests**
- Authentication bypass attempts
- Authorization violations
- Input validation
- Data exposure checks

### 1.2 Test Environments

**Development:**
- Local development server
- Mock data and services
- Hot reload enabled
- Debug tools active

**Staging:**
- Netlify preview deployment
- Real integrations (test accounts)
- Production-like configuration
- Monitoring enabled

**Production:**
- Netlify production deployment
- Real integrations (production accounts)
- Full security controls
- Alerting active

---

## 2. UNIT TESTS

### 2.1 Core Services

**Test File:** `src/services/__tests__/persistenceService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import PersistenceService from '../persistenceService';

describe('PersistenceService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('save and load', () => {
    it('should save and load tasks', () => {
      const tasks = [{ id: '1', title: 'Test Task' }];
      PersistenceService.saveOrchestrationData({ tasks, approvals: [], auditLogs: [] });
      
      const loaded = PersistenceService.loadOrchestrationData();
      expect(loaded.tasks).toEqual(tasks);
    });

    it('should handle empty data', () => {
      const loaded = PersistenceService.loadOrchestrationData();
      expect(loaded.tasks).toEqual([]);
      expect(loaded.approvals).toEqual([]);
      expect(loaded.auditLogs).toEqual([]);
    });

    it('should handle corrupted data', () => {
      localStorage.setItem('neas_orchestration', 'invalid-json');
      const loaded = PersistenceService.loadOrchestrationData();
      expect(loaded.tasks).toEqual([]);
    });
  });

  describe('auto-save', () => {
    it('should debounce saves', async () => {
      const saveSpy = vi.spyOn(PersistenceService, 'saveOrchestrationData');
      
      PersistenceService.autoSave('test', { data: 'value' }, 100);
      PersistenceService.autoSave('test', { data: 'value2' }, 100);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Test File:** `src/services/__tests__/gmailService.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import GmailService from '../gmailService';

describe('GmailService', () => {
  describe('identity verification', () => {
    it('should reject non-authorized emails', async () => {
      const mockProfile = { emailAddress: 'wrong@email.com' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProfile)
      });

      await expect(GmailService.verifyIdentity('token')).rejects.toThrow('Identity mismatch');
    });

    it('should accept authorized email', async () => {
      const mockProfile = { emailAddress: 'info.nextedgeaccesssolutions@gmail.com' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProfile)
      });

      const result = await GmailService.verifyIdentity('token');
      expect(result.email).toBe('info.nextedgeaccesssolutions@gmail.com');
    });
  });

  describe('email classification', () => {
    it('should classify lead emails', () => {
      const email = { subject: 'Inquiry about services', body: 'We need a quote' };
      const category = GmailService.classifyEmailContent(email.subject, email.body);
      expect(category).toBe('lead');
    });

    it('should classify project emails', () => {
      const email = { subject: 'Project update', body: 'Progress report' };
      const category = GmailService.classifyEmailContent(email.subject, email.body);
      expect(category).toBe('project');
    });

    it('should classify safety emails', () => {
      const email = { subject: 'Safety incident', body: 'Incident report' };
      const category = GmailService.classifyEmailContent(email.subject, email.body);
      expect(category).toBe('safety');
    });
  });

  describe('deduplication', () => {
    it('should remove duplicate emails', () => {
      const emails = [
        { id: '1', messageId: 'msg1' },
        { id: '2', messageId: 'msg1' },
        { id: '3', messageId: 'msg2' }
      ];
      
      const deduped = GmailService.deduplicateEmails(emails);
      expect(deduped).toHaveLength(2);
    });
  });
});
```

### 2.2 Utility Functions

**Test File:** `src/utils/__tests__/dateFormatter.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatTime, safeDate } from '../dateFormatter';

describe('dateFormatter', () => {
  describe('safeDate', () => {
    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      expect(safeDate(date)).toEqual(date);
    });

    it('should handle ISO strings', () => {
      const date = safeDate('2024-01-01T00:00:00Z');
      expect(date).toBeInstanceOf(Date);
    });

    it('should handle timestamps', () => {
      const date = safeDate(1704067200000);
      expect(date).toBeInstanceOf(Date);
    });

    it('should return null for invalid dates', () => {
      expect(safeDate('invalid')).toBeNull();
      expect(safeDate(null)).toBeNull();
      expect(safeDate(undefined)).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('should format valid dates', () => {
      const result = formatDate('2024-01-01');
      expect(result).toMatch(/Jan|1|2024/);
    });

    it('should return fallback for invalid dates', () => {
      expect(formatDate('invalid')).toBe('Unavailable');
      expect(formatDate(null, 'Never')).toBe('Never');
    });
  });
});
```

### 2.3 Business Logic

**Test File:** `src/neas/__tests__/orchestrationEngine.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { orchestrationEngine } from '../orchestrationEngine';

describe('OrchestrationEngine', () => {
  beforeEach(() => {
    orchestrationEngine.reset();
  });

  describe('task management', () => {
    it('should create tasks', () => {
      const task = orchestrationEngine.createTask({
        title: 'Test Task',
        description: 'Test Description',
        assignedAgentId: 'agent-1',
        createdBy: 'user-1',
        department: 'operations',
        priority: 'high',
        status: 'queued',
        approvalLevel: 1,
        progress: 0
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('queued');
    });

    it('should update task status', () => {
      const task = orchestrationEngine.createTask({ /* ... */ });
      orchestrationEngine.updateTaskStatus(task.id, 'in_progress', 'agent', 'agent-1');
      
      const updated = orchestrationEngine.getTask(task.id);
      expect(updated.status).toBe('in_progress');
    });

    it('should prevent circular dependencies', () => {
      const task1 = orchestrationEngine.createTask({ /* ... */ });
      const task2 = orchestrationEngine.createTask({ /* ... */ });
      
      orchestrationEngine.addDependency(task1.id, task2.id);
      
      expect(() => {
        orchestrationEngine.addDependency(task2.id, task1.id);
      }).toThrow('Circular dependency');
    });
  });

  describe('approval workflow', () => {
    it('should create approval requests', () => {
      const approval = orchestrationEngine.createApprovalRequest({
        taskId: 'task-1',
        taskTitle: 'Test Task',
        requestedBy: 'user-1',
        requestedByAgent: 'agent-1',
        approvalLevel: 3,
        status: 'pending',
        actionDescription: 'Test Action',
        impact: 'Test Impact',
        riskLevel: 'high'
      });

      expect(approval.id).toBeDefined();
      expect(approval.status).toBe('pending');
    });

    it('should approve requests', () => {
      const approval = orchestrationEngine.createApprovalRequest({ /* ... */ });
      orchestrationEngine.approveRequest(approval.id, 'user-2', 'Approved');
      
      const updated = orchestrationEngine.getApproval(approval.id);
      expect(updated.status).toBe('approved');
      expect(updated.decidedBy).toBe('user-2');
    });

    it('should reject requests', () => {
      const approval = orchestrationEngine.createApprovalRequest({ /* ... */ });
      orchestrationEngine.rejectRequest(approval.id, 'user-2', 'Rejected');
      
      const updated = orchestrationEngine.getApproval(approval.id);
      expect(updated.status).toBe('rejected');
    });
  });

  describe('audit logging', () => {
    it('should log events', () => {
      orchestrationEngine.addAuditLog(
        'user',
        'user-1',
        'task_created',
        'task',
        'task-1',
        'Task created',
        'info'
      );

      const logs = orchestrationEngine.getAuditLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('task_created');
    });

    it('should filter logs by severity', () => {
      orchestrationEngine.addAuditLog('user', 'user-1', 'action1', 'resource', 'id', 'msg', 'info');
      orchestrationEngine.addAuditLog('user', 'user-1', 'action2', 'resource', 'id', 'msg', 'error');
      
      const errorLogs = orchestrationEngine.getAuditLogsBySeverity('error');
      expect(errorLogs).toHaveLength(1);
    });
  });
});
```

---

## 3. INTEGRATION TESTS

### 3.1 Gmail Integration

**Test File:** `src/services/__tests__/gmailIntegration.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GmailService from '../gmailService';

describe('Gmail Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OAuth flow', () => {
    it('should initialize OAuth client', async () => {
      const result = await GmailService.initializeOAuth();
      expect(result).toBe(true);
    });

    it('should handle OAuth errors', async () => {
      global.google = {
        accounts: {
          oauth2: {
            initTokenClient: vi.fn().mockImplementation((config) => {
              config.callback({ error: 'access_denied' });
            })
          }
        }
      };

      await expect(GmailService.startOAuthAuthorization()).rejects.toThrow();
    });
  });

  describe('email synchronization', () => {
    it('should fetch emails from Gmail API', async () => {
      const mockResponse = {
        messages: [{ id: '1' }, { id: '2' }],
        nextPageToken: 'token'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const emails = await GmailService.syncEmails(50);
      expect(emails).toHaveLength(2);
    });

    it('should handle pagination', async () => {
      const mockResponse1 = { messages: [{ id: '1' }], nextPageToken: 'token1' };
      const mockResponse2 = { messages: [{ id: '2' }] };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResponse1) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResponse2) });

      await GmailService.syncEmails(50);
      await GmailService.syncEmails(50, 'token1');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(GmailService.syncEmails(50)).rejects.toThrow();
    });
  });

  describe('connection health', () => {
    it('should check connection health', async () => {
      const mockProfile = {
        messagesTotal: 100,
        messagesUnread: 10,
        historyId: '123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProfile)
      });

      const health = await GmailService.checkConnectionHealth();
      expect(health.status).toBe('healthy');
      expect(health.mailboxMetadata.totalMessages).toBe(100);
    });

    it('should detect expired tokens', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      const health = await GmailService.checkConnectionHealth();
      expect(health.status).toBe('unauthorized');
    });
  });
});
```

### 3.2 Refrens Integration

**Test File:** `src/services/__tests__/refrensIntegration.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import RefrensService from '../refrensService';

describe('Refrens Integration', () => {
  describe('data synchronization', () => {
    it('should sync clients', async () => {
      const clients = await RefrensService.syncClients();
      expect(clients).toBeDefined();
      expect(Array.isArray(clients)).toBe(true);
    });

    it('should sync quotations', async () => {
      const quotations = await RefrensService.syncQuotations();
      expect(quotations).toBeDefined();
      expect(Array.isArray(quotations)).toBe(true);
    });

    it('should sync invoices', async () => {
      const invoices = await RefrensService.syncInvoices();
      expect(invoices).toBeDefined();
      expect(Array.isArray(invoices)).toBe(true);
    });

    it('should prevent duplicates', async () => {
      await RefrensService.syncClients();
      const clients1 = RefrensService.getClients();
      
      await RefrensService.syncClients();
      const clients2 = RefrensService.getClients();
      
      expect(clients1.length).toBe(clients2.length);
    });
  });

  describe('connection health', () => {
    it('should check connection health', async () => {
      const health = await RefrensService.checkConnectionHealth();
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
    });
  });

  describe('data access', () => {
    it('should get clients', () => {
      const clients = RefrensService.getClients();
      expect(Array.isArray(clients)).toBe(true);
    });

    it('should get quotations by client', () => {
      const quotations = RefrensService.getQuotationsByClient('client-1');
      expect(Array.isArray(quotations)).toBe(true);
    });

    it('should get invoices by quotation', () => {
      const invoices = RefrensService.getInvoicesByQuotation('quote-1');
      expect(Array.isArray(invoices)).toBe(true);
    });
  });
});
```

---

## 4. END-TO-END TESTS

### 4.1 Authentication Flow

**Test File:** `e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login with demo credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verify user info displayed
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Demo User');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Verify redirect to login
    await expect(page).toHaveURL('/');
  });

  test('should persist session across refresh', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    
    // Refresh page
    await page.reload();
    
    // Verify still logged in
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Demo User');
  });
});
```

### 4.2 Task Management Workflow

**Test File:** `e2e/tasks.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
  });

  test('should create a new task', async ({ page }) => {
    // Navigate to task monitor
    await page.click('[data-testid="nav-task-monitor"]');
    
    // Create task
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title"]', 'Test Task');
    await page.fill('[data-testid="task-description"]', 'Test Description');
    await page.selectOption('[data-testid="task-priority"]', 'high');
    await page.click('[data-testid="save-task-button"]');
    
    // Verify task created
    await expect(page.locator('[data-testid="task-list"]')).toContainText('Test Task');
  });

  test('should assign task to agent', async ({ page }) => {
    // Navigate to task monitor
    await page.click('[data-testid="nav-task-monitor"]');
    
    // Select task
    await page.click('[data-testid="task-item"]:first-child');
    
    // Assign to agent
    await page.click('[data-testid="assign-button"]');
    await page.selectOption('[data-testid="agent-select"]', 'agent-1');
    await page.click('[data-testid="confirm-assign-button"]');
    
    // Verify assignment
    await expect(page.locator('[data-testid="assigned-agent"]')).toContainText('Agent 1');
  });

  test('should complete task', async ({ page }) => {
    // Navigate to task monitor
    await page.click('[data-testid="nav-task-monitor"]');
    
    // Select in-progress task
    await page.click('[data-testid="task-item"][data-status="in_progress"]');
    
    // Complete task
    await page.click('[data-testid="complete-button"]');
    await page.click('[data-testid="confirm-complete-button"]');
    
    // Verify completion
    await expect(page.locator('[data-testid="task-status"]')).toContainText('completed');
  });

  test('should persist task data across refresh', async ({ page }) => {
    // Create task
    await page.click('[data-testid="nav-task-monitor"]');
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title"]', 'Persistence Test');
    await page.click('[data-testid="save-task-button"]');
    
    // Refresh page
    await page.reload();
    
    // Verify task still exists
    await page.click('[data-testid="nav-task-monitor"]');
    await expect(page.locator('[data-testid="task-list"]')).toContainText('Persistence Test');
  });
});
```

### 4.3 Approval Workflow

**Test File:** `e2e/approvals.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as CEO
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
  });

  test('should display pending approvals', async ({ page }) => {
    // Navigate to approval inbox
    await page.click('[data-testid="nav-approvals"]');
    
    // Verify pending approvals displayed
    const pendingCount = await page.locator('[data-testid="pending-badge"]').textContent();
    expect(parseInt(pendingCount)).toBeGreaterThan(0);
  });

  test('should approve request', async ({ page }) => {
    // Navigate to approval inbox
    await page.click('[data-testid="nav-approvals"]');
    
    // Select first pending approval
    await page.click('[data-testid="approval-item"]:first-child');
    
    // Approve
    await page.click('[data-testid="approve-button"]');
    await page.fill('[data-testid="approval-notes"]', 'Approved for testing');
    await page.click('[data-testid="confirm-approve-button"]');
    
    // Verify approval
    await expect(page.locator('[data-testid="approval-status"]')).toContainText('approved');
  });

  test('should reject request', async ({ page }) => {
    // Navigate to approval inbox
    await page.click('[data-testid="nav-approvals"]');
    
    // Select first pending approval
    await page.click('[data-testid="approval-item"]:first-child');
    
    // Reject
    await page.click('[data-testid="reject-button"]');
    await page.fill('[data-testid="rejection-notes"]', 'Rejected for testing');
    await page.click('[data-testid="confirm-reject-button"]');
    
    // Verify rejection
    await expect(page.locator('[data-testid="approval-status"]')).toContainText('rejected');
  });

  test('should log approval in audit trail', async ({ page }) => {
    // Approve a request
    await page.click('[data-testid="nav-approvals"]');
    await page.click('[data-testid="approval-item"]:first-child');
    await page.click('[data-testid="approve-button"]');
    await page.click('[data-testid="confirm-approve-button"]');
    
    // Check audit log
    await page.click('[data-testid="nav-audit"]');
    await expect(page.locator('[data-testid="audit-list"]')).toContainText('approval_granted');
  });
});
```

### 4.4 Gmail Integration

**Test File:** `e2e/gmail.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Gmail Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
  });

  test('should display Gmail authorization page', async ({ page }) => {
    // Navigate to Gmail authorization
    await page.click('[data-testid="nav-gmail"]');
    
    // Verify page loads
    await expect(page.locator('[data-testid="gmail-auth-header"]')).toBeVisible();
  });

  test('should show authorization status', async ({ page }) => {
    // Navigate to Gmail authorization
    await page.click('[data-testid="nav-gmail"]');
    
    // Verify status displayed
    const status = await page.locator('[data-testid="connection-status"]').textContent();
    expect(['awaiting_authorization', 'authorized', 'healthy']).toContain(status);
  });

  test('should display sync statistics', async ({ page }) => {
    // Navigate to Gmail authorization
    await page.click('[data-testid="nav-gmail"]');
    
    // Verify stats displayed
    await expect(page.locator('[data-testid="emails-imported"]')).toBeVisible();
    await expect(page.locator('[data-testid="emails-skipped"]')).toBeVisible();
    await expect(page.locator('[data-testid="emails-failed"]')).toBeVisible();
  });
});
```

---

## 5. PERFORMANCE TESTS

### 5.1 Load Time Tests

**Test File:** `performance/loadTime.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance - Load Time', () => {
  test('homepage should load in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('dashboard should load in under 1 second', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to dashboard
    const startTime = Date.now();
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForSelector('[data-testid="dashboard-loaded"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(1000);
  });

  test('module switch should be under 100ms', async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="nav-dashboard"]');
    
    // Switch modules
    const startTime = Date.now();
    await page.click('[data-testid="nav-tasks"]');
    await page.waitForSelector('[data-testid="tasks-loaded"]');
    const switchTime = Date.now() - startTime;
    
    expect(switchTime).toBeLessThan(100);
  });
});
```

### 5.2 Memory Tests

**Test File:** `performance/memory.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance - Memory', () => {
  test('should not leak memory after 10 minutes', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Navigate through modules for 10 minutes
    const modules = ['dashboard', 'tasks', 'projects', 'approvals', 'email'];
    for (let i = 0; i < 60; i++) {
      const module = modules[i % modules.length];
      await page.click(`[data-testid="nav-${module}"]`);
      await page.waitForTimeout(10000); // 10 seconds
    }
    
    // Get final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory should not increase by more than 50MB
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

### 5.3 Bundle Size Tests

**Test File:** `performance/bundleSize.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.describe('Performance - Bundle Size', () => {
  test('JavaScript bundle should be under 600KB', () => {
    const stats = JSON.parse(readFileSync('dist/stats.json', 'utf-8'));
    const jsSize = stats.assets.find((a: any) => a.name.endsWith('.js')).size;
    
    expect(jsSize).toBeLessThan(600 * 1024);
  });

  test('CSS bundle should be under 100KB', () => {
    const stats = JSON.parse(readFileSync('dist/stats.json', 'utf-8'));
    const cssSize = stats.assets.find((a: any) => a.name.endsWith('.css')).size;
    
    expect(cssSize).toBeLessThan(100 * 1024);
  });

  test('Total bundle should be under 700KB', () => {
    const stats = JSON.parse(readFileSync('dist/stats.json', 'utf-8'));
    const totalSize = stats.assets.reduce((sum: number, a: any) => sum + a.size, 0);
    
    expect(totalSize).toBeLessThan(700 * 1024);
  });
});
```

---

## 6. SECURITY TESTS

### 6.1 Authentication Tests

**Test File:** `security/authentication.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Security - Authentication', () => {
  test('should not allow access without authentication', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/');
  });

  test('should not expose credentials in source', async ({ page }) => {
    const response = await page.goto('/');
    const html = await response.text();
    
    expect(html).not.toContain('password');
    expect(html).not.toContain('secret');
    expect(html).not.toContain('api_key');
  });

  test('should not store tokens in localStorage', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    
    // Check localStorage
    const localStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) items[key] = window.localStorage.getItem(key) || '';
      }
      return items;
    });
    
    // Should not contain tokens
    expect(JSON.stringify(localStorage)).not.toContain('token');
    expect(JSON.stringify(localStorage)).not.toContain('access_token');
  });
});
```

### 6.2 Authorization Tests

**Test File:** `security/authorization.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Security - Authorization', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'user@neas.co');
    await page.fill('[data-testid="password-input"]', 'user123');
    await page.click('[data-testid="login-button"]');
  });

  test('should not allow access to admin pages', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Should show access denied
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });

  test('should not allow unauthorized API calls', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/admin/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return res.status;
    });
    
    expect(response).toBe(403);
  });
});
```

### 6.3 Input Validation Tests

**Test File:** `security/validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Security - Input Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'demo@neas.co');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
  });

  test('should sanitize HTML input', async ({ page }) => {
    await page.click('[data-testid="nav-tasks"]');
    await page.click('[data-testid="create-task-button"]');
    
    // Try XSS attack
    await page.fill('[data-testid="task-title"]', '<script>alert("xss")</script>');
    await page.click('[data-testid="save-task-button"]');
    
    // Verify script tag is escaped
    const title = await page.locator('[data-testid="task-title-display"]').textContent();
    expect(title).not.toContain('<script>');
  });

  test('should validate email format', async ({ page }) => {
    await page.click('[data-testid="nav-users"]');
    await page.click('[data-testid="invite-user-button"]');
    
    // Try invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="send-invite-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
  });

  test('should prevent SQL injection', async ({ page }) => {
    await page.click('[data-testid="nav-tasks"]');
    
    // Try SQL injection in search
    await page.fill('[data-testid="search-input"]', "'; DROP TABLE tasks; --");
    await page.click('[data-testid="search-button"]');
    
    // Verify no error and results displayed
    await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
  });
});
```

---

## 7. TEST EXECUTION PLAN

### 7.1 Test Schedule

**Week 1: Unit Tests**
- Day 1-2: Core services tests
- Day 3-4: Utility function tests
- Day 5: Business logic tests

**Week 2: Integration Tests**
- Day 1-2: Gmail integration tests
- Day 3-4: Refrens integration tests
- Day 5: Database integration tests

**Week 3: E2E Tests**
- Day 1-2: Authentication flow tests
- Day 3-4: Task management tests
- Day 5: Approval workflow tests

**Week 4: Performance & Security Tests**
- Day 1-2: Load time tests
- Day 3: Memory tests
- Day 4: Security tests
- Day 5: Final verification

### 7.2 Test Execution Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security

# Generate coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### 7.3 Test Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | 80% | TBD |
| Integration Tests | 70% | TBD |
| E2E Tests | 60% | TBD |
| Security Tests | 100% | TBD |
| Performance Tests | 100% | TBD |
| Overall Coverage | 75% | TBD |

---

## 8. TEST REPORTING

### 8.1 Test Report Format

```markdown
# Test Report - [Date]

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X
- Coverage: X%

## Failed Tests
1. [Test Name]
   - File: [file path]
   - Error: [error message]
   - Screenshot: [link]

## Performance Metrics
- Load Time: Xms
- Memory Usage: XMB
- Bundle Size: XKB

## Security Findings
- Vulnerabilities: X
- Warnings: X
- Recommendations: X

## Recommendations
1. [Recommendation]
2. [Recommendation]
```

### 8.2 Continuous Integration

**GitHub Actions Workflow:**

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 9. TEST MAINTENANCE

### 9.1 Test Data Management

**Test Data Strategy:**
- Use fixtures for consistent test data
- Mock external services (Gmail, Refrens)
- Clean up test data after each test
- Use separate test database

**Test Data Files:**
```
tests/
├── fixtures/
│   ├── users.json
│   ├── tasks.json
│   ├── approvals.json
│   └── emails.json
├── mocks/
│   ├── gmailApi.ts
│   ├── refrensApi.ts
│   └── database.ts
└── helpers/
    ├── testData.ts
    ├── auth.ts
    └── cleanup.ts
```

### 9.2 Test Documentation

**Document each test:**
- Purpose and scope
- Prerequisites
- Test steps
- Expected results
- Cleanup requirements

**Example:**
```typescript
/**
 * Test: Task Creation
 * 
 * Purpose: Verify that users can create new tasks
 * 
 * Prerequisites:
 * - User must be logged in
 * - User must have task creation permission
 * 
 * Steps:
 * 1. Navigate to task monitor
 * 2. Click create task button
 * 3. Fill in task details
 * 4. Save task
 * 
 * Expected:
 * - Task appears in task list
 * - Task has correct details
 * - Audit log entry created
 * 
 * Cleanup:
 * - Delete created task
 */
```

---

## 10. CONCLUSION

This comprehensive test plan covers all aspects of the NEAS Operations Management System:

✅ **Unit Tests** - Core functionality validation  
✅ **Integration Tests** - Service integration verification  
✅ **E2E Tests** - Complete workflow testing  
✅ **Performance Tests** - Load time and memory validation  
✅ **Security Tests** - Authentication and authorization verification  

**Next Steps:**
1. Set up testing framework (Vitest + Playwright)
2. Implement unit tests for core services
3. Implement integration tests for external services
4. Implement E2E tests for critical workflows
5. Implement performance and security tests
6. Set up CI/CD pipeline
7. Execute test suite
8. Generate coverage report
9. Fix any failing tests
10. Document test results

**Success Criteria:**
- 80%+ code coverage
- All critical workflows tested
- No security vulnerabilities
- Performance within acceptable limits
- All tests passing in CI/CD

---

**Document Version:** 1.0.0  
**Last Updated:** 23 October 2026  
**Next Review:** After test suite implementation  
**Owner:** QA Engineering Team
