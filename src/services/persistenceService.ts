/**
 * NEAS AI Virtual Office - Data Persistence Service
 * Handles localStorage persistence for all critical data
 */

const STORAGE_KEYS = {
  TASKS: 'neas_tasks',
  APPROVALS: 'neas_approvals',
  AUDIT_LOGS: 'neas_audit_logs',
  AGENT_STATUSES: 'neas_agent_statuses',
  WORKFLOWS: 'neas_workflows',
  LEADS: 'neas_leads',
  PROJECTS: 'neas_projects',
  INVOICES: 'neas_invoices',
  EXPENSES: 'neas_expenses',
  QUOTATIONS: 'neas_quotations',
  EMPLOYEES: 'neas_employees',
  INCIDENTS: 'neas_incidents',
  INSPECTIONS: 'neas_inspections',
  INVENTORY: 'neas_inventory',
  PURCHASE_ORDERS: 'neas_purchase_orders',
  CAMPAIGNS: 'neas_campaigns',
  REPORTS: 'neas_reports',
  USERS: 'neas_users',
  SETTINGS: 'neas_settings',
};

export class PersistenceService {
  /**
   * Save data to localStorage
   */
  static save<T>(key: string, data: T): boolean {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`[PersistenceService] Failed to save ${key}:`, error);
      return false;
    }
  }

  /**
   * Load data from localStorage
   */
  static load<T>(key: string, defaultValue: T): T {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return defaultValue;
      }
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`[PersistenceService] Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove data from localStorage
   */
  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[PersistenceService] Failed to remove ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all NEAS data from localStorage
   */
  static clearAll(): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('[PersistenceService] Failed to clear all data:', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          used += value.length;
        }
      });
      
      // Estimate total available (5MB typical limit)
      const total = 5 * 1024 * 1024;
      const percentage = (used / total) * 100;
      
      return { used, total, percentage };
    } catch (error) {
      console.error('[PersistenceService] Failed to get storage info:', error);
      return { used: 0, total: 5 * 1024 * 1024, percentage: 0 };
    }
  }

  /**
   * Save all orchestration engine data
   */
  static saveOrchestrationData(data: {
    tasks?: any[];
    approvals?: any[];
    auditLogs?: any[];
  }): boolean {
    let success = true;
    
    if (data.tasks) {
      success = this.save(STORAGE_KEYS.TASKS, data.tasks) && success;
    }
    if (data.approvals) {
      success = this.save(STORAGE_KEYS.APPROVALS, data.approvals) && success;
    }
    if (data.auditLogs) {
      success = this.save(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs) && success;
    }
    
    return success;
  }

  /**
   * Load all orchestration engine data
   */
  static loadOrchestrationData(): {
    tasks: any[];
    approvals: any[];
    auditLogs: any[];
  } {
    return {
      tasks: this.load(STORAGE_KEYS.TASKS, []),
      approvals: this.load(STORAGE_KEYS.APPROVALS, []),
      auditLogs: this.load(STORAGE_KEYS.AUDIT_LOGS, []),
    };
  }

  /**
   * Save module-specific data
   */
  static saveModuleData(module: string, data: any): boolean {
    const keyMap: Record<string, string> = {
      workflows: STORAGE_KEYS.WORKFLOWS,
      leads: STORAGE_KEYS.LEADS,
      projects: STORAGE_KEYS.PROJECTS,
      invoices: STORAGE_KEYS.INVOICES,
      expenses: STORAGE_KEYS.EXPENSES,
      quotations: STORAGE_KEYS.QUOTATIONS,
      employees: STORAGE_KEYS.EMPLOYEES,
      incidents: STORAGE_KEYS.INCIDENTS,
      inspections: STORAGE_KEYS.INSPECTIONS,
      inventory: STORAGE_KEYS.INVENTORY,
      purchaseOrders: STORAGE_KEYS.PURCHASE_ORDERS,
      campaigns: STORAGE_KEYS.CAMPAIGNS,
      reports: STORAGE_KEYS.REPORTS,
      users: STORAGE_KEYS.USERS,
    };

    const key = keyMap[module];
    if (!key) {
      console.error(`[PersistenceService] Unknown module: ${module}`);
      return false;
    }

    return this.save(key, data);
  }

  /**
   * Load module-specific data
   */
  static loadModuleData<T>(module: string, defaultValue: T): T {
    const keyMap: Record<string, string> = {
      workflows: STORAGE_KEYS.WORKFLOWS,
      leads: STORAGE_KEYS.LEADS,
      projects: STORAGE_KEYS.PROJECTS,
      invoices: STORAGE_KEYS.INVOICES,
      expenses: STORAGE_KEYS.EXPENSES,
      quotations: STORAGE_KEYS.QUOTATIONS,
      employees: STORAGE_KEYS.EMPLOYEES,
      incidents: STORAGE_KEYS.INCIDENTS,
      inspections: STORAGE_KEYS.INSPECTIONS,
      inventory: STORAGE_KEYS.INVENTORY,
      purchaseOrders: STORAGE_KEYS.PURCHASE_ORDERS,
      campaigns: STORAGE_KEYS.CAMPAIGNS,
      reports: STORAGE_KEYS.REPORTS,
      users: STORAGE_KEYS.USERS,
    };

    const key = keyMap[module];
    if (!key) {
      console.error(`[PersistenceService] Unknown module: ${module}`);
      return defaultValue;
    }

    return this.load(key, defaultValue);
  }

  /**
   * Auto-save with debounce
   */
  private static saveTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  static autoSave<T>(key: string, data: T, delay: number = 1000): void {
    // Clear existing timeout
    const existingTimeout = this.saveTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.save(key, data);
      this.saveTimeouts.delete(key);
    }, delay);

    this.saveTimeouts.set(key, timeout);
  }

  /**
   * Export all data as JSON
   */
  static exportAllData(): string {
    const data: Record<string, any> = {};
    
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[name] = JSON.parse(value);
        } catch {
          data[name] = value;
        }
      }
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  static importAllData(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        if (data[name] !== undefined) {
          this.save(key, data[name]);
        }
      });

      return true;
    } catch (error) {
      console.error('[PersistenceService] Failed to import data:', error);
      return false;
    }
  }
}

export default PersistenceService;
