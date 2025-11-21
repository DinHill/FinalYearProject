// Finance API Types
export interface InvoiceLine {
  id: number;
  invoice_id: number;
  fee_structure_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  status: string;
  notes: string | null;
  payment_date: string;
  processed_by_id: number | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  student_id: number;
  semester_id: number;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  issued_date: string;
  balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentFinancialSummary {
  student_id: number;
  student_name: string;
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  invoice_count: number;
  status_breakdown: {
    pending?: number;
    partial?: number;
    paid?: number;
    overdue?: number;
    cancelled?: number;
  };
}

export interface InvoiceDetail extends Invoice {
  lines: InvoiceLine[];
  payments: Payment[];
}
