export interface JWTPayload {
  userId: string;
  companyId: string;
  email: string;
  role: 'OWNER' | 'ACCOUNTANT';
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Express.Request {
  user?: JWTPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CompanySetupData {
  name: string;
  business_number?: string;
  country: string;
  province: string;
  fiscal_year_start_month: number;
  currency: string;
  gst_hst_registered: boolean;
  gst_hst_number?: string;
  gst_hst_rate: number;
  invoice_prefix?: string;
  next_invoice_number?: number;
  invoice_payment_terms?: string;
}

export interface InvoiceData {
  client_id: string;
  estimate_id?: string;
  issue_date: string;
  due_date: string;
  payment_terms?: string;
  notes?: string;
  lines: InvoiceLineData[];
}

export interface InvoiceLineData {
  description: string;
  quantity: number;
  unit_price_cents: number;
}

export interface ExpenseData {
  supplier_id?: string;
  category_id: string;
  client_id?: string;
  description: string;
  amount_cents: number;
  gst_hst_recoverable_cents?: number;
  expense_date: string;
}
