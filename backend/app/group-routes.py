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

# GET: /api/groups/:id/members
@app.route("/groups/:id/members", methods=["GET"])

def get_groups_members():
    cur = db.get_db().cur()
    cur.execute(''' SELECT *
                    FROM GroupProfileJunction gp
                    JOIN Profile p ON gp.profile_id = p.profile_id
                    WHERE gp.group_id = $1
                    ORDER BY p.profile_name;''')
    groups = cur.fetchall()
    return jsonify(groups), 200

# DELETE: /api/groups/:id/members/:user_id
@app.route("/groups/:id/members/:user_id", methods=["DELETE"])

def delete_member_from_group(id, user_id):
    cur = db.get_db().cur()
    cur.execute(''' DELETE FROM GroupProfileJunction
                    WHERE group_id - %s AND profile_id = %s;
                ''', (id, user_id))
    db.get_db().commit()

    deleted_row = cur.fetchone()
    conn.commit()

    return {
        "message": "Member successfully removed from group.",
        "removed_member": deleted_row
    }




