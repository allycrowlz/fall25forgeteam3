const API_BASE = "http://127.0.0.1:8000/api/expenses";

// ============================================
// TYPES
// ============================================

export interface ExpenseList {
  list_id: number;
  list_name: string;
  group_id: number;
  date_created: string;
  date_closed: string | null;
}

export interface ExpenseSplit {
  profile_id: number;
  amount_owed: number;
}

export interface ExpenseItemCreate {
  item_name: string;
  list_id: number;
  item_total_cost: number;
  notes?: string;
  paid_by_id: number;
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_end_date?: string;
  splits: ExpenseSplit[];
}

export interface ExpenseItem {
  item_id: number;
  item_name: string;
  list_id: number;
  item_total_cost: number;
  notes: string | null;
  paid_by_id: number;
  date_created: string;
  is_recurring: boolean;
  recurring_frequency: string | null;
  recurring_end_date: string | null;
  is_deleted: boolean;
  paid_by_name: string;
  group_id?: number;
}

export interface ExpenseSplitDetail {
  split_id: number;
  item_id: number;
  profile_id: number;
  amount_owed: number;
  is_settled: boolean;
  date_created: string;
  date_settled: string | null;
  profile_name: string;
  profile_picture: string | null;
  item_name: string;
  paid_by_id: number;
  paid_by_name: string;
  group_id: number;
  expense_date?: string;
  item_total_cost?: number;
  list_name?: string;
}

export interface UserBalance {
  profile_id: number;
  total_owed_to_me: number;
  total_i_owe: number;
  net_balance: number;
}

export interface PersonBalance {
  profile_id: number;
  profile_name: string;
  profile_picture: string | null;
  amount: number; // Positive = they owe me, Negative = I owe them
}

export interface ExpenseStats {
  total_spent: number;
  weekly_expenses: { week_start: string; total: number }[];
  monthly_expenses: { month_start: string; total: number }[];
}

// ============================================
// EXPENSE LISTS
// ============================================

export async function createExpenseList(
  groupId: number,
  listName: string
): Promise<ExpenseList> {
  const response = await fetch(`${API_BASE}/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group_id: groupId, list_name: listName }),
  });
  if (!response.ok) throw new Error("Failed to create expense list");
  return response.json();
}

export async function getGroupExpenseLists(
  groupId: number
): Promise<ExpenseList[]> {
  const response = await fetch(`${API_BASE}/groups/${groupId}/lists`);
  if (!response.ok) throw new Error("Failed to fetch expense lists");
  return response.json();
}

// ============================================
// EXPENSES
// ============================================

export async function createExpense(
  expense: ExpenseItemCreate
): Promise<ExpenseItem> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  if (!response.ok) throw new Error("Failed to create expense");
  return response.json();
}

export async function getExpense(itemId: number): Promise<ExpenseItem> {
  const response = await fetch(`${API_BASE}/${itemId}`);
  if (!response.ok) throw new Error("Failed to fetch expense");
  return response.json();
}

export async function getGroupExpenses(
  groupId: number,
  includeDeleted: boolean = false
): Promise<ExpenseItem[]> {
  const url = `${API_BASE}/groups/${groupId}/expenses?include_deleted=${includeDeleted}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch group expenses");
  return response.json();
}

export async function deleteExpense(itemId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${itemId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete expense");
}

// ============================================
// SPLITS
// ============================================

export async function settleSplit(splitId: number): Promise<ExpenseSplitDetail> {
  const response = await fetch(`${API_BASE}/splits/${splitId}/settle`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error("Failed to settle split");
  return response.json();
}

export async function getUserSplits(
  profileId: number,
  groupId?: number,
  settled?: boolean
): Promise<ExpenseSplitDetail[]> {
  let url = `${API_BASE}/users/${profileId}/splits`;
  const params = new URLSearchParams();
  if (groupId !== undefined) params.append("group_id", groupId.toString());
  if (settled !== undefined) params.append("settled", settled.toString());
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch user splits");
  return response.json();
}

// ============================================
// BALANCES
// ============================================

export async function getUserBalance(
  profileId: number,
  groupId?: number
): Promise<UserBalance> {
  let url = `${API_BASE}/users/${profileId}/balance`;
  if (groupId) url += `?group_id=${groupId}`;
  
  console.log('Fetching balance from:', url);
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Balance fetch error:', response.status, errorText);
    throw new Error(`Failed to fetch balance: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('Balance data:', data);
  return data;
}

export async function getUserBalancesByPerson(
  profileId: number,
  groupId?: number
): Promise<PersonBalance[]> {
  let url = `${API_BASE}/users/${profileId}/balances`;
  if (groupId) url += `?group_id=${groupId}`;
  
  console.log('Fetching balances from:', url);
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Balances fetch error:', response.status, errorText);
    throw new Error(`Failed to fetch balances: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('Balances data:', data);
  return data;
}

// ============================================
// STATISTICS
// ============================================

export async function getExpenseStats(
  profileId: number,
  groupId?: number,
  weeks: number = 4
): Promise<ExpenseStats> {
  let url = `${API_BASE}/users/${profileId}/stats?weeks=${weeks}`;
  if (groupId) url += `&group_id=${groupId}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch expense stats");
  return response.json();
}