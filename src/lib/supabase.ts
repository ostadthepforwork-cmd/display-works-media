import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for quote requests table
export type QuoteRequest = {
  id?: string;
  created_at?: string;
  name: string;
  phone: string;
  line_id?: string;
  service_type: string;
  width?: string;
  height?: string;
  quantity?: number;
  details?: string;
  need_date?: string;
  status?: "pending" | "contacted" | "confirmed" | "completed";
};

// Insert a new quote request
export async function insertQuoteRequest(data: QuoteRequest) {
  const { data: result, error } = await supabase
    .from("quote_requests")
    .insert([data])
    .select();

  if (error) throw error;
  return result;
}

// Get all quote requests (admin)
export async function getQuoteRequests() {
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
