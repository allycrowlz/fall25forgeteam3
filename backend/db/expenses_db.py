from backend.db.connection import get_connection

EXPENSE_TABLES = """
-- Drop existing tables in correct order (dependencies first)
DROP TABLE IF EXISTS expense_split CASCADE;
DROP TABLE IF EXISTS expense_item CASCADE;
DROP TABLE IF EXISTS expense_list CASCADE;

-- Expense Lists (container for expenses within a group)
CREATE TABLE expense_list (
    list_id SERIAL PRIMARY KEY,
    list_name VARCHAR(100) NOT NULL,
    group_id INTEGER NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_closed TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (group_id) REFERENCES "Group"(group_id) ON DELETE CASCADE
);

-- Main Expense Items
CREATE TABLE expense_item (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    list_id INTEGER NOT NULL,
    item_total_cost DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    paid_by_id INTEGER NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Recurring fields
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    recurring_end_date DATE,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (list_id) REFERENCES expense_list(list_id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by_id) REFERENCES Profile(profile_id) ON DELETE CASCADE
);

-- Expense Splits (who owes what)
CREATE TABLE expense_split (
    split_id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL,
    amount_owed DECIMAL(10, 2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_settled TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES expense_item(item_id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES Profile(profile_id) ON DELETE CASCADE,
    CONSTRAINT unique_item_profile UNIQUE(item_id, profile_id)
);

-- Indexes for performance
CREATE INDEX idx_expense_list_group ON expense_list(group_id);
CREATE INDEX idx_expense_item_list ON expense_item(list_id);
CREATE INDEX idx_expense_item_paid_by ON expense_item(paid_by_id);
CREATE INDEX idx_expense_item_deleted ON expense_item(is_deleted);
CREATE INDEX idx_expense_split_item ON expense_split(item_id);
CREATE INDEX idx_expense_split_profile ON expense_split(profile_id);
CREATE INDEX idx_expense_split_settled ON expense_split(is_settled);
"""

def create_expense_tables():
    """Create Expense related tables"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("Dropping old Expense tables (if they exist)...")
        print("Creating new Expense tables with updated schema...")
        cursor.execute(EXPENSE_TABLES)
        conn.commit()
        
        print("✓ Successfully created Expense tables")
        print("  - expense_list (with group_id)")
        print("  - expense_item (with recurring fields, is_deleted)")
        print("  - expense_split (with is_settled, date_settled)")
        print("  - All indexes created")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"✗ Error creating Expense tables: {e}")
        raise

if __name__ == "__main__":
    print("=" * 60)
    print("EXPENSE TABLES SETUP")
    print("=" * 60)
    print("\nThis will DROP and recreate all expense tables.")
    print("⚠️  WARNING: This will delete ALL existing expense data!")
    print("\nNew schema includes:")
    print("  - Recurring expenses (frequency, end date)")
    print("  - Soft delete (is_deleted flag)")
    print("  - Settlement tracking (is_settled, date_settled)")
    print("  - Performance indexes")
    print("\n" + "=" * 60)
    
    response = input("\nContinue? (yes/no): ").lower().strip()
    
    if response == 'yes':
        create_expense_tables()
        print("\n✓ Database setup complete!")
    else:
        print("\n✗ Setup cancelled.")