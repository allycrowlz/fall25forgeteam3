const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ListItem {
  item_id: number;
  item_name: string;
  list_id: number;
  item_quantity: number;
  added_by: number;
  date_added: string;
  bought: boolean;
}

export interface ShoppingList {
  list_id: number;
  list_name: string;
  date_created: string;
  date_closed: string | null;
  group_id: number;
  items?: ListItem[];
}

export interface AddItemRequest {
  item_name: string;
  item_quantity?: number;
  added_by: number;
}

export interface UpdateItemRequest {
  item_name?: string;
  item_quantity?: number;
  bought?: boolean;
}

// Get all shopping lists for a group
export async function getShoppingLists(groupId: number): Promise<ShoppingList[]> {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/lists`);
  if (!response.ok) {
    throw new Error(`Failed to fetch shopping lists: ${response.statusText}`);
  }
  return response.json();
}

// Get a single shopping list with all items
export async function getShoppingListWithItems(listId: number): Promise<ShoppingList> {
  const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch shopping list: ${response.statusText}`);
  }
  return response.json();
}

// Create a new shopping list
export async function createShoppingList(groupId: number, listName: string): Promise<ShoppingList> {
  const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/lists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ list_name: listName }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create shopping list: ${response.statusText}`);
  }
  return response.json();
}

// Add an item to a shopping list
export async function addItemToList(listId: number, item: AddItemRequest): Promise<ListItem> {
  const response = await fetch(`${API_BASE_URL}/api/lists/${listId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error(`Failed to add item: ${response.statusText}`);
  }
  return response.json();
}

// Update an item (check/uncheck, edit name/quantity)
export async function updateItem(itemId: number, updates: UpdateItemRequest): Promise<ListItem> {
  const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`Failed to update item: ${response.statusText}`);
  }
  return response.json();
}

// Delete an item
export async function deleteItem(itemId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete item: ${response.statusText}`);
  }
}

// Delete a shopping list
export async function deleteShoppingList(listId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete shopping list: ${response.statusText}`);
  }
}

