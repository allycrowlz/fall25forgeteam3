// Automatically detect backend URL based on current hostname
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};
const API_BASE_URL = getApiBaseUrl();

type Expense = {
    item_name: String;
    list_id: number;
    item_total_cost: number;
    item_quantity: number;
    notes: String | undefined;
    bought_by_id: number;
}

export async function getUserGroups(profileId: number) {
    const response = await fetch(`${API_BASE_URL}/api/groups?profile_id=${profileId}`);
    if (!response.ok) throw new Error(response.statusText)
    return response.json();
}

export async function getGroupMembers(groupId : number) {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`);
    if (!response.ok) throw new Error("Failed to fetch groups.");
    return response.json();
}

export async function getGroupExpenseLists(groupId : number) {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/expenselists`);
    if (!response.ok) throw new Error("Failed to fetch groups.");
    return response.json();
}

export async function postExpense(expenseName: String,
                                    listId: number,
                                    cost: number,
                                    quantity: number,
                                    notes: String | undefined,
                                    payer: number) {

       const expense: Expense = {
        item_name: expenseName,
        list_id: listId,
        item_total_cost: cost,
        item_quantity: quantity,
        notes: notes,
        bought_by_id: payer
    };
    const response = await fetch(`${API_BASE_URL}/api/expenseslists/expenses`, {
     method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expense),
    });
    console.log(response.status);
}

export async function postSplit() {

}