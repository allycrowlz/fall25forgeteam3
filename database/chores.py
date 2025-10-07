from connection import get_connection

CHORE_TABLES = """
CREATE TABLE Chore (
    chore_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (group_id) REFERENCES "Group"(group_id) ON DELETE CASCADE
);

CREATE TABLE ChoreAssignee (
    profile_id INTEGER NOT NULL,
    chore_id INTEGER NOT NULL,
    individual_status VARCHAR(20) DEFAULT 'pending' CHECK (individual_status IN ('pending', 'completed')),
    PRIMARY KEY (profile_id, chore_id),
    FOREIGN KEY (profile_id) REFERENCES Profile(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (chore_id) REFERENCES Chore(chore_id) ON DELETE CASCADE
);
"""

def create_chore_tables():
    """Create Chore related tables"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("Creating Chore tables...")
        cursor.execute(CHORE_TABLES)
        conn.commit()
        
        print("Successfully created Chore tables")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error creating Chore tables: {e}")
        raise

if __name__ == "__main__":
    create_chore_tables()