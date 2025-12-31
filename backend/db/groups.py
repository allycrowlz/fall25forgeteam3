from connection import get_connection

GROUP_TABLES = """
DROP TABLE IF EXISTS GroupProfile CASCADE;
DROP TABLE IF EXISTS "Group" CASCADE;

CREATE TABLE "Group" (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    group_photo VARCHAR(255),
    join_code VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE GroupProfile (
    group_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('creator', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, profile_id),
    FOREIGN KEY (group_id) REFERENCES "Group"(group_id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES Profile(profile_id) ON DELETE CASCADE
);
"""

def create_group_tables():
    """Create Group related tables"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("Creating Group tables...")
        cursor.execute(GROUP_TABLES)
        conn.commit()
        
        print("Successfully created Group tables")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error creating Group tables: {e}")
        raise

if __name__ == "__main__":
    create_group_tables()