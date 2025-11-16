from backend.db.connection import get_connection

EXPENSE_TABLES = """
DROP TABLE IF EXISTS expense_split CASCADE;
DROP TABLE IF EXISTS expense_item CASCADE;
DROP TABLE IF EXISTS expense_list CASCADE;


CREATE TABLE expense_list (
    list_id SERIAL PRIMARY KEY,
    list_name VARCHAR(100) NOT NULL,
    group_id INTEGER NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_closed TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES "Group"(group_id) ON DELETE CASCADE,
    UNIQUE (group_id, list_name)
);

CREATE TABLE expense_item (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    list_id INTEGER NOT NULL,
    item_total_cost DECIMAL(10, 2) NOT NULL,
    item_quantity INTEGER DEFAULT 1,
    notes TEXT,
    bought_by_id INTEGER NOT NULL,
    date_bought TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES expense_list(list_id) ON DELETE CASCADE,
    FOREIGN KEY (bought_by_id) REFERENCES Profile(profile_id) ON DELETE RESTRICT
);

CREATE TABLE expense_split (
    split_id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    amount_owed DECIMAL(10, 2) NOT NULL,
    profile_id INTEGER NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES expense_item(item_id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES Profile(profile_id) ON DELETE RESTRICT
);
"""

def create_expense_tables():
    """Create Expense related tables"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("Creating Expense tables...")
        cursor.execute(EXPENSE_TABLES)
        conn.commit()
        
        print("Successfully created Expense tables")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error creating Expense tables: {e}")
        raise

if __name__ == "__main__":
    create_expense_tables()