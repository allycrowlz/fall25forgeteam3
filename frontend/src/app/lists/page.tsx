"use client";

import React, { useMemo, useState, useEffect } from "react";
import ProtectedRoute from '../components/ProtectedRoute';
import { Plus, Trash2, Download, Check, X } from "lucide-react";
import { useGroup } from '../contexts/GroupContext';
import { getCurrentUser } from '../services/authService';
import { 
  getShoppingListWithItems, 
  addItemToList, 
  updateItem, 
  deleteItem,
  getShoppingLists,
  createShoppingList,
  deleteShoppingList,
  ListItem as ApiListItem,
  ShoppingList
} from "../services/shoppingListService";

// Color scheme
const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";

// Types
interface Item { 
  item_id: number; 
  item_name: string; 
  bought: boolean; 
  item_quantity: number;
  added_by: number;
}

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: Item;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all hover:shadow-md" style={{ backgroundColor: "white", borderColor: BROWN }}>
      <input
        type="checkbox"
        checked={item.bought}
        onChange={() => onToggle(item.item_id)}
        className="h-5 w-5 rounded cursor-pointer"
        style={{ accentColor: BROWN }}
      />
      <span className={`grow font-medium ${item.bought ? "line-through opacity-60" : ""}`} style={{ color: BROWN }}>
        {item.item_name}
      </span>
      {item.item_quantity > 1 && (
        <span className="px-2 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: BEIGE, color: BROWN }}>
          x{item.item_quantity}
        </span>
      )}
      <button
        onClick={() => onDelete(item.item_id)}
        className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all"
        aria-label="Delete item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function ShoppingListPage() {
  const { currentGroup, loading: groupLoading } = useGroup();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allLists, setAllLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState("");

  const remaining = useMemo(() => {
    const done = items.filter((i) => i.bought).length;
    return { done, total: items.length };
  }, [items]);

  // Get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        if (user.profile_id) {
          setCurrentUserId(parseInt(user.profile_id, 10));
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUserId();
  }, []);

  // Fetch all shopping lists when group changes
  useEffect(() => {
    if (!currentGroup) {
      setLoading(false);
      return;
    }
    
    const fetchLists = async () => {
      try {
        setLoading(true);
        const lists = await getShoppingLists(currentGroup.group_id);
        setAllLists(lists);
        if (lists.length > 0) {
          setCurrentList(lists[0]);
        } else {
          setCurrentList(null);
          setItems([]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lists");
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, [currentGroup]);

  // Fetch items when current list changes
  useEffect(() => {
    if (!currentList) {
      setItems([]);
      return;
    }
    
    const fetchItems = async () => {
      try {
        setLoading(true);
        const list = await getShoppingListWithItems(currentList.list_id);
        setItems(list.items || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load items");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [currentList]);

  const addItem = async () => {
    if (!newItemName.trim() || !currentList || !currentUserId) return;
    
    try {
      const newItem = await addItemToList(currentList.list_id, {
        item_name: newItemName,
        item_quantity: newItemQuantity,
        added_by: currentUserId,
      });
      setItems((prev) => [...prev, newItem as Item]);
      setNewItemName("");
      setNewItemQuantity(1);
      setShowAddForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add item");
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim() || !currentGroup) return;
    
    try {
      const newList = await createShoppingList(currentGroup.group_id, newListName);
      setAllLists((prev) => [...prev, newList]);
      setCurrentList(newList);
      setNewListName("");
      setShowNewListForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create list");
    }
  };

  const handleDeleteList = async () => {
    if (!currentList) return;
    
    if (!confirm(`Are you sure you want to delete "${currentList.list_name}"? This will delete all items in the list.`)) {
      return;
    }
    
    try {
      await deleteShoppingList(currentList.list_id);
      const updatedLists = allLists.filter(l => l.list_id !== currentList.list_id);
      setAllLists(updatedLists);
      setCurrentList(updatedLists.length > 0 ? updatedLists[0] : null);
      setItems([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete list");
    }
  };

  const handleExportList = () => {
    if (!currentList || items.length === 0) return;
    
    // Create text content
    const header = `${currentList.list_name}\nCreated: ${new Date(currentList.date_created).toLocaleDateString()}\n\n`;
    const uncheckedItems = items.filter(item => !item.bought);
    const checkedItems = items.filter(item => item.bought);
    
    let content = header;
    
    if (uncheckedItems.length > 0) {
      content += "Items to Buy:\n";
      uncheckedItems.forEach(item => {
        content += `☐ ${item.item_name}${item.item_quantity > 1 ? ` (x${item.item_quantity})` : ''}\n`;
      });
    }
    
    if (checkedItems.length > 0) {
      content += "\nPurchased Items:\n";
      checkedItems.forEach(item => {
        content += `☑ ${item.item_name}${item.item_quantity > 1 ? ` (x${item.item_quantity})` : ''}\n`;
      });
    }
    
    content += `\nTotal Items: ${items.length}\nRemaining: ${uncheckedItems.length}\n`;
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentList.list_name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const switchList = (list: ShoppingList) => {
    setCurrentList(list);
  };

  const toggleItem = async (itemId: number) => {
    const item = items.find((i) => i.item_id === itemId);
    if (!item) return;

    try {
      const updated = await updateItem(itemId, { bought: !item.bought });
      setItems((prev) =>
        prev.map((i) => (i.item_id === itemId ? (updated as Item) : i))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      await deleteItem(itemId);
      setItems((prev) => prev.filter((i) => i.item_id !== itemId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete item");
    }
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-lg font-medium" style={{ color: BROWN }}>Loading groups...</div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-center py-16 bg-white rounded-3xl shadow-lg border" style={{ borderColor: BROWN }}>
            <h1 className="text-4xl font-bold mb-4" style={{ color: BROWN }}>No Group Selected</h1>
            <p className="text-xl mb-8" style={{ color: BROWN }}>
              You need to create or join a group to access shopping lists
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold" style={{ color: GREEN }}>Shopping Lists</h1>
            <button
              onClick={() => setShowNewListForm(!showNewListForm)}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold hover:opacity-90 transition-all shadow-md"
              style={{ backgroundColor: GREEN, color: "white" }}
            >
              <Plus className="h-5 w-5" />
              New List
            </button>
          </div>

          {/* List Selector and Actions */}
          {allLists.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[300px]">
                  <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Current List</label>
                  <select
                    value={currentList?.list_id || ""}
                    onChange={(e) => {
                      const list = allLists.find(l => l.list_id === parseInt(e.target.value));
                      if (list) switchList(list);
                    }}
                    className="w-full px-4 py-2.5 border-2 rounded-xl font-medium focus:outline-none focus:ring-2"
                    style={{ borderColor: BROWN, color: BROWN, backgroundColor: "white" }}
                  >
                    {allLists.map((list) => (
                      <option key={list.list_id} value={list.list_id}>
                        {list.list_name} - {new Date(list.date_created).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                
                {currentList && (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: BEIGE, border: `2px solid ${BROWN}` }}>
                      <span className="font-semibold" style={{ color: BROWN }}>
                        {remaining.total - remaining.done} / {remaining.total} remaining
                      </span>
                    </div>
                    
                    <button
                      onClick={handleExportList}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium hover:opacity-80 transition-all border-2"
                      style={{ borderColor: BROWN, color: BROWN, backgroundColor: "white" }}
                      title="Export list"
                    >
                      <Download className="h-5 w-5" />
                      Export
                    </button>
                    
                    <button
                      onClick={handleDeleteList}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      aria-label="Delete list"
                      title="Delete this list"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* New List Form */}
          {showNewListForm && (
            <div className="mt-6 bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: BROWN }}>Create New List</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name (e.g., Weekly Groceries)"
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: BROWN, color: BROWN }}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateList()}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateList}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
                    style={{ backgroundColor: GREEN, color: "white" }}
                  >
                    <Check className="h-5 w-5" />
                    Create List
                  </button>
                  <button
                    onClick={() => setShowNewListForm(false)}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 rounded-xl font-semibold hover:opacity-80 transition-all"
                    style={{ borderColor: BROWN, color: BROWN, backgroundColor: "white" }}
                  >
                    <X className="h-5 w-5" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 font-medium">
            {error}
          </div>
        )}

        {!currentList && allLists.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg border" style={{ borderColor: BROWN }}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: BEIGE }}>
              <Plus className="h-10 w-10" style={{ color: BROWN }} />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: BROWN }}>No shopping lists yet</h2>
            <p className="text-lg mb-6" style={{ color: BROWN }}>Click "New List" to create your first shopping list!</p>
          </div>
        ) : currentList ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 border" style={{ borderColor: BROWN }}>
            {/* List Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b-2" style={{ borderColor: BEIGE }}>
              <h2 className="text-3xl font-bold" style={{ color: BROWN }}>{currentList.list_name}</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
                style={{ backgroundColor: GREEN, color: "white" }}
              >
                <Plus className="h-5 w-5" />
                Add Item
              </button>
            </div>

            {/* Add Item Form */}
            {showAddForm && (
              <div className="mb-6 p-6 rounded-xl border-2" style={{ backgroundColor: BEIGE, borderColor: BROWN }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: BROWN }}>Add New Item</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Item name"
                    className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white"
                    style={{ borderColor: BROWN, color: BROWN }}
                    onKeyPress={(e) => e.key === "Enter" && addItem()}
                    autoFocus
                  />
                  <div className="flex gap-3 items-center flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="font-medium" style={{ color: BROWN }}>Quantity:</label>
                      <input
                        type="number"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-20 px-3 py-2 border-2 rounded-xl focus:outline-none bg-white"
                        style={{ borderColor: BROWN, color: BROWN }}
                      />
                    </div>
                    <button
                      onClick={addItem}
                      disabled={!newItemName.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: GREEN, color: "white" }}
                    >
                      <Check className="h-5 w-5" />
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewItemName("");
                        setNewItemQuantity(1);
                      }}
                      className="px-5 py-2.5 border-2 rounded-xl font-semibold hover:opacity-80 transition-all"
                      style={{ borderColor: BROWN, color: BROWN, backgroundColor: "white" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: BEIGE }} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 rounded-xl border-2" style={{ backgroundColor: BEIGE, borderColor: BROWN }}>
                <p className="text-lg font-medium mb-2" style={{ color: BROWN }}>No items yet</p>
                <p style={{ color: BROWN }}>Click "Add Item" to add your first item!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <ItemRow
                    key={item.item_id}
                    item={item}
                    onToggle={toggleItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function ProtectedShoppingListPage() {
  return (
    <ProtectedRoute>
      <ShoppingListPage />
    </ProtectedRoute>
  );
}