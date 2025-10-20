"use client";

import React, { useMemo, useState } from "react";
import { Plus, Star, Upload } from "lucide-react";

// Types
type CategoryKey = "Meat" | "Produce" | "Dairy" | "Other";
interface Item { id: string; text: string; checked: boolean; }
type CategoryMap = Record<CategoryKey, Item[]>;

function Section({
  title,
  items,
  onAdd,
  onToggle,
}: {
  title: CategoryKey;
  items: Item[];
  onAdd: (title: CategoryKey) => void;
  onToggle: (title: CategoryKey, id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-md border border-[#a8c09e]/60 bg-[#eef6ea] px-3 py-2">
        <span className="grow text-center font-medium text-[#2b4a2e]">{title}</span>
        <button
          aria-label={`add ${title} item`}
          onClick={() => onAdd(title)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#a8c09e] text-[#2b4a2e] hover:bg-[#dfeede]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-6 rounded-full bg-neutral-200/70"/>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2 shadow-sm"
            >
              <input
                type="checkbox"
                checked={it.checked}
                onChange={() => onToggle(title, it.id)}
                className="h-4 w-4 accent-[#2b4a2e]"
              />
              <span className={`grow ${it.checked ? "text-neutral-400 line-through" : "text-neutral-800"}`}>
                {it.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ShoppingListPage() {
  const [categories, setCategories] = useState<CategoryMap>({
    Meat: [],
    Produce: [],
    Dairy: [],
    Other: [],
  });

  const remaining = useMemo(() => {
    const all = Object.values(categories).flat();
    return { done: all.filter((i) => i.checked).length, total: all.length };
  }, [categories]);

  const addItem = (key: CategoryKey) => {
    const text = prompt(`Add a new ${key} item:`);
    if (!text) return;
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCategories((prev) => ({
      ...prev,
      [key]: [
        ...prev[key],
        { id, text, checked: false },
      ],
    }));
  };

  const toggleItem = (key: CategoryKey, id: string) => {
    setCategories((prev) => ({
      ...prev,
      [key]: prev[key].map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    }));
  };

  return (
    <div className="min-h-screen bg-white text-[#2b4a2e]">
      {/* Top Nav */}
      <header className="sticky top-0 z-10 border-b border-[#d7e3cf] bg-[#cfe1bc]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-extrabold tracking-tight">HomeB
              <span className="inline-block -translate-y-0.5 text-emerald-900">🏠</span>
              se
            </span>
          </div>
          <nav className="flex items-center gap-8 text-[15px]">
            {[
              { label: "Home", active: false },
              { label: "Lists", active: true },
              { label: "Chores", active: false },
              { label: "Expenses", active: false },
              { label: "Profile", active: false },
              { label: "Settings", active: false },
            ].map((link) => (
              <a
                key={link.label}
                href="#"
                className={
                  "font-medium hover:underline " +
                  (link.active ? "text-emerald-900" : "text-[#2b4a2e]/80")
                }
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <h1 className="text-5xl font-extrabold">Shopping List</h1>
          <p className="text-lg text-[#2b4a2e]/80">
            {remaining.total - remaining.done} out of {remaining.total || "__"} items remaining
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          {/* Left: categories */}
          <section className="space-y-6">
            <Section title="Meat" items={categories.Meat} onAdd={addItem} onToggle={toggleItem} />
            <Section title="Produce" items={categories.Produce} onAdd={addItem} onToggle={toggleItem} />
            <Section title="Dairy" items={categories.Dairy} onAdd={addItem} onToggle={toggleItem} />
            <Section title="Other" items={categories.Other} onAdd={addItem} onToggle={toggleItem} />
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
      </main>
    </div>
  );
}