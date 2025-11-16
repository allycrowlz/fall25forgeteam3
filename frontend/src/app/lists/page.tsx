"use client";

import React, { useMemo, useState, useEffect } from "react";
import ProtectedRoute from '../components/ProtectedRoute';
import { Plus, Star, Upload, Trash2, List } from "lucide-react";
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
    <li className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <input
        type="checkbox"
        checked={item.bought}
        onChange={() => onToggle(item.item_id)}
        className="h-4 w-4 accent-[#2b4a2e]"
      />
      <span className={`grow ${item.bought ? "text-neutral-400 line-through" : "text-neutral-800"}`}>
        {item.item_name} {item.item_quantity > 1 && `(x${item.item_quantity})`}
      </span>
      <button
        onClick={() => onDelete(item.item_id)}
        className="text-red-500 hover:text-red-700"
        aria-label="Delete item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function ShoppingListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allLists, setAllLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [groupId] = useState<number>(55); // TODO: Get from URL params or context
  const [currentUserId] = useState<number>(153); // TODO: Get from auth context
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState("");

  const remaining = useMemo(() => {
    const done = items.filter((i) => i.bought).length;
    return { done, total: items.length };
  }, [items]);

  // Fetch all shopping lists on mount
  useEffect(() => {
    const fetchLists = async () => {
      try {
        setLoading(true);
        const lists = await getShoppingLists(groupId);
        setAllLists(lists);
        if (lists.length > 0) {
          setCurrentList(lists[0]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lists");
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, [groupId]);

  // Fetch items when current list changes
  useEffect(() => {
    if (!currentList) return;
    
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
    if (!newItemName.trim() || !currentList) return;
    
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
    if (!newListName.trim()) return;
    
    try {
      const newList = await createShoppingList(groupId, newListName);
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

  return (
    <div className="min-h-screen text-black" style={{ backgroundColor: "#E8F3E9" }}>
      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-5xl text-[#4C331D] font-extrabold" >Lists</h1>
            <button
              onClick={() => setShowNewListForm(!showNewListForm)}
              className="flex items-center gap-2 rounded-full border border-[#2b4a2e] px-4 py-2 text-[#2b4a2e] hover:bg-[#FFFFFF]"
            >
              <Plus className="h-4 w-4" />
              New List
            </button>
          </div>

          {/* List Selector */}
          <div className="flex items-center gap-3">
            <List className="h-5 w-5 text-[#2b4a2e]" />
            <select
              value={currentList?.list_id || ""}
              onChange={(e) => {
                const list = allLists.find(l => l.list_id === parseInt(e.target.value));
                if (list) switchList(list);
              }}
              className="flex-1 max-w-md px-4 py-2 border border-[#a8c09e] rounded-md bg-white text-[#2b4a2e] focus:outline-none focus:ring-2 focus:ring-[#2b4a2e]"
            >
              {allLists.length === 0 && <option value="">No lists available</option>}
              {allLists.map((list) => (
                <option key={list.list_id} value={list.list_id}>
                  {list.list_name} ({new Date(list.date_created).toLocaleDateString()})
                </option>
              ))}
            </select>
            {currentList && (
              <>
                <p className="text-lg text-[#2b4a2e]/80">
                  {remaining.total - remaining.done} out of {remaining.total || 0} items remaining
                </p>
                <button
                  onClick={handleDeleteList}
                  className="text-red-500 hover:text-red-700 p-2"
                  aria-label="Delete list"
                  title="Delete this list"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* New List Form */}
          {showNewListForm && (
            <div className="rounded-md border border-[#a8c09e] bg-white p-4 space-y-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name (e.g., Weekly Groceries)"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                onKeyPress={(e) => e.key === "Enter" && handleCreateList()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateList}
                  className="px-4 py-2 bg-[#2b4a2e] text-white rounded-md hover:bg-[#1f3721]"
                >
                  Create List
                </button>
                <button
                  onClick={() => setShowNewListForm(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 border border-red-400 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {!currentList && allLists.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-neutral-600 mb-4">No shopping lists yet</p>
            <p className="text-neutral-500">Click "New List" to create your first shopping list!</p>
          </div>
        ) : currentList ? (
          <>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
            {/* Left: Shopping list items */}
            <section className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md border border-[#4C331D]/60 bg-[#DCCEBD] px-3 py-2">
                  <span className="grow text-center font-medium text-[#4C331D]">
                    {currentList.list_name}
                  </span>
                  <button
                    aria-label="add item"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#4C331D] text-[#4C331D] hover:bg-[#FFFFFF]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

              {/* Add Item Form */}
              {showAddForm && (
                <div className="rounded-md border border-[#a8c09e] bg-white p-4 space-y-3">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Item name"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    onKeyPress={(e) => e.key === "Enter" && addItem()}
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={newItemQuantity}
                      onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-20 px-3 py-2 border border-neutral-300 rounded-md"
                    />
                    <button
                      onClick={addItem}
                      className="px-4 py-2 bg-[#2b4a2e] text-white rounded-md hover:bg-[#1f3721]"
                    >
                      Add Item
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-6 rounded-full bg-neutral-200/70" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No items yet. Click + to add your first item!
                </div>
              ) : (
                <ul className="space-y-2">
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
          </section>

          {/* Right: Favorites card */}
          <aside className="space-y-3">
            <div className="text-center text-[15px] font-medium text-[#2b4a2e]">Add from favorites</div>
            <div className="flex justify-center">
              <Star className="h-7 w-7" fill="#2b4a2e" color="#2b4a2e" />
            </div>
            <div className="rounded-lg border border-neutral-300 bg-white p-4 min-h-[32rem] shadow-sm" />
          </aside>
        </div>

        {/* Footer action */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            className="flex items-center gap-2 rounded-full border border-[#2b4a2e] px-4 py-2 text-[#2b4a2e] hover:bg-[#eef6ea]"
            onClick={() => alert("Share/Export coming soon")}
          >
            <span>Share or export grocery list</span>
          </button>
          <Upload className="h-8 w-8" />
        </div>
        </>
        ) : null}
      </main>
    </div>
  );
}

// Wrap with ProtectedRoute before exporting
export default function ProtectedShoppingListPage() {
  return (
    <ProtectedRoute>
      <ShoppingListPage />
    </ProtectedRoute>
  );
}