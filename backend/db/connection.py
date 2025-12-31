import psycopg2
from psycopg2.extras import RealDictCursor 

def get_connection():
    """
    Returns a connection to the PostgreSQL database.
    Other files should import and use this function.
    """
    return psycopg2.connect(
        dbname="homebase_dev",
        user="homebase_dev",
        password="homebase_devforge25",
        host="5.161.238.246",
        port="5432",
        cursor_factory=RealDictCursor
    )