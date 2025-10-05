from fastapi import FastAPI, request, jsonify, g
import psycopg2
from psycopg2.extras import RealDictCursor
from functools import wraps
import secrets

conn = get_db()
conn = psycopg2.connect("dbname=test user=postgres")

# GET: /api/groups
@app.route("/groups", methods=["GET"])

def get_groups():
    cur = db.get_db().cur()
    cur.execute(''' SELECT * 
                   FROM Group 
                   ORDER BY group_id; ''')
    
    groups = cur.fetchall()
    return jsonify(groups), 200
    
# GET: /api/groups/:id
@app.route("/groups/:id", methods=["GET"])

def get_groups_ID():
    cur = db.get_db().cur()
    cur.execute(''' SELECT * 
                   FROM Group 
                   WHERE group_id = %s
                   ORDER BY group_id; ''')
     
    groups = cur.fetchall()
    return jsonify(groups), 200











