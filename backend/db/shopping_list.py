from connection import get_connection

SHOPPING_LIST_TABLES = """
CREATE TABLE "shopping_list" (
    list_id SERIAL PRIMARY KEY,
    list_name VARCHAR(100) NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_closed TIMESTAMP,
    group_id INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES "Group"(group_id) ON DELETE CASCADE
);

CREATE TABLE "list_item" (
    item_id SERIAL PRIMARY KEY, 
    item_name VARCHAR(100) NOT NULL, 
    list_id INTEGER NOT NULL,
    item_quantity INTEGER DEFAULT 1,
    added_by INTEGER NOT NULL,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bought BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (list_id) REFERENCES shopping_list(list_id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES Profile(profile_id) ON DELETE RESTRICT
);
"""

def create_shopping_list_tables():
    """Create Shopping list related tables"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("Creating Shopping list tables...")
        cursor.execute(SHOPPING_LIST_TABLES)
        conn.commit()
        
        print("Successfully created Shopping List tables")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error creating Shopping List tables: {e}")
        raise

if __name__ == "__main__":
    create_shopping_list_tables()