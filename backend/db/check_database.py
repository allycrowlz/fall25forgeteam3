from connection import get_connection

def check_database():
    """Check what tables already exist"""
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        
        if tables:
            print("Tables already in database:")
            for table in tables:
                print(f"  - {table[0]}")
            print("\nDatabase is already set up!")
        else:
            print("No tables found in database")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_database()