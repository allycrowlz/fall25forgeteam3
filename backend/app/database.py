import psycopg2

# Connect to your postgres DB
conn = psycopg2.connect(
    dbname="homebase_dev",
    user="homebase_dev",
    password="homebase_devforge25",
    host="5.161.238.246",
    port=5432
)
# Open a cursor to perform database operations
cur = conn.cursor()

# Execute a query
cur.execute("SELECT * FROM my_data")

# Retrieve query results
records = cur.fetchall()