from connection import get_connection

PROFILE_EVENT_TABLES = """
-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS ProfileEvent CASCADE;
DROP TABLE IF EXISTS Event CASCADE;

-- Recreate Profile table (don't drop since it has users)
CREATE TABLE IF NOT EXISTS Profile (
    profile_id SERIAL PRIMARY KEY,
    profile_name VARCHAR(100) NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    email VARCHAR(255) UNIQUE NOT NULL, 
    password_hash VARCHAR(255) NOT NULL,
    picture VARCHAR(255),
    birthday DATE,
    phone VARCHAR(20)
);

-- Create Event table WITH group_id and TIMESTAMPTZ for proper timezone handling
CREATE TABLE Event (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    event_datetime_start TIMESTAMPTZ NOT NULL,
    event_datetime_end TIMESTAMPTZ,
    event_location VARCHAR(255),
    event_notes TEXT,
    group_id INTEGER,
    FOREIGN KEY (group_id) REFERENCES "Group"(group_id) ON DELETE SET NULL
);

-- Create index for better performance
CREATE INDEX idx_event_group_id ON Event(group_id);

-- Create ProfileEvent junction table
CREATE TABLE ProfileEvent (
    profile_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    PRIMARY KEY (profile_id, event_id),
    FOREIGN KEY (profile_id) REFERENCES Profile(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE
);
"""

def create_profile_event_tables():
    """Create Profile and Event related tables"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("Dropping and recreating Event tables with group_id support and TIMESTAMPTZ...")
        cursor.execute(PROFILE_EVENT_TABLES)
        conn.commit()
        
        print("✅ Successfully created Event tables with group_id column and timezone support")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error creating Profile/Event tables: {e}")
        raise

if __name__ == "__main__":
    create_profile_event_tables()