from connection import get_connection

PROFILE_EVENT_TABLES = """
CREATE TABLE Profile (
    profile_id SERIAL PRIMARY KEY,
    profile_name VARCHAR(100) NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    email VARCHAR(255) UNIQUE NOT NULL, 
    password_hash VARCHAR(255) NOT NULL,
    picture VARCHAR(255),
    birthday DATE
);

CREATE TABLE Event (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    event_datetime_start TIMESTAMP NOT NULL,
    event_datetime_end TIMESTAMP,
    event_location VARCHAR(255),
    event_notes TEXT
);

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
        
        print("Creating Profile and Event tables...")
        cursor.execute(PROFILE_EVENT_TABLES)
        conn.commit()
        
        print("Successfully created Profile and Event tables")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error creating Profile/Event tables: {e}")
        raise

if __name__ == "__main__":
    create_profile_event_tables()