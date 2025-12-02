import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from db.connection import get_connection

CHORE_TABLES = """
CREATE TABLE IF NOT EXISTS Chore (
    chore_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (group_id) REFERENCES "Group"(group_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ChoreAssignee (
    profile_id INTEGER NOT NULL,
    chore_id INTEGER NOT NULL,
    individual_status VARCHAR(20) DEFAULT 'pending' CHECK (individual_status IN ('pending', 'completed')),
    PRIMARY KEY (profile_id, chore_id),
    FOREIGN KEY (profile_id) REFERENCES Profile(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (chore_id) REFERENCES Chore(chore_id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chore_group_id ON Chore(group_id);
CREATE INDEX IF NOT EXISTS idx_chore_due_date ON Chore(due_date);
CREATE INDEX IF NOT EXISTS idx_chore_assignee_profile ON ChoreAssignee(profile_id);
CREATE INDEX IF NOT EXISTS idx_chore_assignee_chore ON ChoreAssignee(chore_id);
"""

ADD_CATEGORY = """
ALTER TABLE Chore ADD COLUMN IF NOT EXISTS category VARCHAR(50);
"""

def create_chore_tables():
    """Create Chore related tables"""
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("Creating Chore tables...")
        cursor.execute(CHORE_TABLES)
        conn.commit()
        
        print("Adding category column...")
        cursor.execute(ADD_CATEGORY)
        conn.commit()
        
        print("Successfully created Chore tables")
        
    except Exception as e:
        print(f"Error creating Chore tables: {e}")
        if conn:
            conn.rollback()
        raise
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_chore_tables()