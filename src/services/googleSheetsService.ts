/**
 * NEAS AI Virtual Office - Google Sheets Integration Service
 * Connects to company HR/Finance spreadsheet for real data
 */

const SPREADSHEET_ID = '1hOf_eByDKcv6GEQiz44s37xqzf-cbbHY0kTVBZikEDE';

export interface SheetData {
  range: string;
  values: any[][];
}

export interface EmployeeRecord {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  hireDate: string;
  status: 'active' | 'on-leave' | 'terminated';
  certifications: string[];
  skills: string[];
}

export interface FinancialRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  project?: string;
  approved: boolean;
}

export class GoogleSheetsService {
  private static isInitialized = false;

  /**
   * Initialize Google Sheets API
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Check if gapi is available
      if (typeof gapi === 'undefined') {
        console.warn('[GoogleSheetsService] Google API not loaded');
        return false;
      }

      // Load the Sheets API
      await new Promise<void>((resolve, reject) => {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      this.isInitialized = true;
      console.log('[GoogleSheetsService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[GoogleSheetsService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Read data from a specific sheet
   */
  static async readSheet(range: string): Promise<SheetData | null> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn('[GoogleSheetsService] Using mock data - API not available');
          return this.getMockData(range);
        }
      }

      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
      });

      return {
        range: range,
        values: response.result.values || [],
      };
    } catch (error) {
      console.error('[GoogleSheetsService] Failed to read sheet:', error);
      // Return mock data as fallback
      return this.getMockData(range);
    }
  }

  /**
   * Get mock data for development/testing
   */
  private static getMockData(range: string): SheetData {
    // Provide realistic mock data based on range
    if (range.includes('Employees') || range.includes('HR')) {
      return {
        range,
        values: [
          ['ID', 'Name', 'Position', 'Department', 'Email', 'Phone', 'Hire Date', 'Status', 'Certifications', 'Skills'],
          ['EMP001', 'Juan Dela Cruz', 'IRATA L2 Technician', 'Operations', 'juan@neas.com.ph', '+63 917 123 4567', '2022-03-15', 'Active', 'IRATA L2, First Aid', 'Rope Access, Facade Cleaning'],
          ['EMP002', 'Maria Santos', 'IRATA L3 Supervisor', 'Operations', 'maria@neas.com.ph', '+63 918 234 5678', '2020-01-10', 'Active', 'IRATA L3, Safety Officer', 'Team Leadership, Risk Assessment'],
          ['EMP003', 'Pedro Reyes', 'IRATA L1 Technician', 'Operations', 'pedro@neas.com.ph', '+63 919 345 6789', '2023-06-01', 'Active', 'IRATA L1', 'Rope Access, Inspection'],
          ['EMP004', 'Ana Lopez', 'Project Manager', 'Projects', 'ana@neas.com.ph', '+63 920 456 7890', '2021-09-15', 'Active', 'PMP, PRINCE2', 'Project Management, Client Relations'],
          ['EMP005', 'Carlos Garcia', 'Sales Manager', 'Sales', 'carlos@neas.com.ph', '+63 921 567 8901', '2019-03-20', 'Active', 'Sales Certification', 'Business Development, Negotiation'],
        ],
      };
    }

    if (range.includes('Finance') || range.includes('Financial')) {
      return {
        range,
        values: [
          ['ID', 'Date', 'Category', 'Description', 'Amount', 'Type', 'Project', 'Approved'],
          ['FIN001', '2024-02-01', 'Equipment', 'Rope access kit rental', '25000', 'expense', 'BGC Tower', 'true'],
          ['FIN002', '2024-02-03', 'Transport', 'Team transport to Cebu', '45000', 'expense', 'Cebu Port', 'true'],
          ['FIN003', '2024-02-05', 'Materials', 'Cleaning supplies', '18000', 'expense', 'BGC Tower', 'true'],
          ['FIN004', '2024-02-07', 'Labor', 'Technician wages - Week 1', '85000', 'expense', 'Cebu Port', 'false'],
          ['FIN005', '2024-02-10', 'Invoice', 'BGC Tower - Phase 1', '1250000', 'income', 'BGC Tower', 'true'],
          ['FIN006', '2024-02-12', 'Invoice', 'Cebu Port - Progress', '400000', 'income', 'Cebu Port', 'true'],
        ],
      };
    }

    // Default empty data
    return {
      range,
      values: [],
    };
  }

  /**
   * Parse employee records from sheet data
   */
  static parseEmployeeRecords(data: SheetData): EmployeeRecord[] {
    if (!data.values || data.values.length < 2) {
      return [];
    }

    const headers = data.values[0];
    const records: EmployeeRecord[] = [];

    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (row.length < headers.length) continue;

      const record: EmployeeRecord = {
        id: row[0] || `EMP${i.toString().padStart(3, '0')}`,
        name: row[1] || '',
        position: row[2] || '',
        department: row[3] || '',
        email: row[4] || '',
        phone: row[5] || '',
        hireDate: row[6] || '',
        status: (row[7] || 'active').toLowerCase() as 'active' | 'on-leave' | 'terminated',
        certifications: (row[8] || '').split(',').map((c: string) => c.trim()).filter((c: string) => c),
        skills: (row[9] || '').split(',').map((s: string) => s.trim()).filter((s: string) => s),
      };

      records.push(record);
    }

    return records;
  }

  /**
   * Parse financial records from sheet data
   */
  static parseFinancialRecords(data: SheetData): FinancialRecord[] {
    if (!data.values || data.values.length < 2) {
      return [];
    }

    const headers = data.values[0];
    const records: FinancialRecord[] = [];

    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (row.length < headers.length) continue;

      const record: FinancialRecord = {
        id: row[0] || `FIN${i.toString().padStart(3, '0')}`,
        date: row[1] || new Date().toISOString().split('T')[0],
        category: row[2] || '',
        description: row[3] || '',
        amount: parseFloat(row[4]) || 0,
        type: (row[5] || 'expense').toLowerCase() as 'income' | 'expense',
        project: row[6] || undefined,
        approved: row[7] === 'true' || row[7] === true,
      };

      records.push(record);
    }

    return records;
  }

  /**
   * Get all employee records
   */
  static async getEmployees(): Promise<EmployeeRecord[]> {
    const data = await this.readSheet('HR!A1:J100');
    if (!data) {
      console.warn('[GoogleSheetsService] No employee data available');
      return [];
    }
    return this.parseEmployeeRecords(data);
  }

  /**
   * Get all financial records
   */
  static async getFinancialRecords(): Promise<FinancialRecord[]> {
    const data = await this.readSheet('Finance!A1:H100');
    if (!data) {
      console.warn('[GoogleSheetsService] No financial data available');
      return [];
    }
    return this.parseFinancialRecords(data);
  }

  /**
   * Get summary statistics
   */
  static async getSummary(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  }> {
    const employees = await this.getEmployees();
    const financials = await this.getFinancialRecords();

    const activeEmployees = employees.filter(e => e.status === 'active').length;
    const totalIncome = financials
      .filter(f => f.type === 'income' && f.approved)
      .reduce((sum, f) => sum + f.amount, 0);
    const totalExpenses = financials
      .filter(f => f.type === 'expense' && f.approved)
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      totalEmployees: employees.length,
      activeEmployees,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    };
  }
}

export default GoogleSheetsService;
