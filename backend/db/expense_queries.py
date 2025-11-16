from datetime import datetime
import psycopg2
from .pydanticmodels import ExpenseItem, ExpenseItemCreate, ExpenseList
from backend.db.connection import get_connection

def get_all_expenses_in_list(list_id: int):
    """Return all expenses in a list as pydantic models."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM expense_item WHERE list_id = %s;", (list_id,))
    rows = cur.fetchall()
    columns = [d[0] for d in cur.description]
    data = [dict(zip(columns, row)) for row in rows]
    expenses = [ExpenseItem(**item) for item in data]
    cur.close()
    conn.close()
    return expenses

def get_item_in_list(list_id: int, item_id: int):
    """Return one expense from a list as a pydantic model."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM expense_item WHERE list_id = %s AND item_id = %s;",
        (list_id, item_id),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row is None:
        return None
    columns = [d[0] for d in cur.description]
    item = dict(zip(columns, row))
    return ExpenseItem(**item)

def get_group_lists(group_id: int):
    """Return all expense lists for a group as pydantic models."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM expense_list WHERE group_id = %s;", (group_id,))
    rows = cur.fetchall()
    columns = [d[0] for d in cur.description]
    data = [dict(zip(columns, row)) for row in rows]
    lists = [ExpenseList(**exp_list) for exp_list in data]
    cur.close()
    conn.close()
    return lists

def delete_expense(item_id: int):
    """Delete all expense_item rows with the given item_id."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM expense_item WHERE item_id = %s;", (item_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

def create_expense(expense: ExpenseItemCreate):
    """Insert a new expense_item and return the created ExpenseItem."""
    conn = get_connection()  
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO expense_item
              (item_name, list_id, item_total_cost, item_quantity, notes, bought_by_id, date_bought)
            VALUES
              (%s, %s, %s, %s, %s, %s, %s)
            RETURNING item_id, date_bought;
            """,
            (
                expense.item_name,
                expense.list_id,
                expense.item_total_cost,
                expense.item_quantity,
                expense.notes,
                expense.bought_by_id,
                datetime.now(),
            ),
        )
        item_id, date_bought = cur.fetchone()
        conn.commit()
        return ExpenseItem(item_id=item_id, date_bought=date_bought, **expense.model_dump())
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

def get_recent_expenses_for_user(user_id: int, limit: int = 3):
    """
    Get recent expenses for a user across all their groups
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                e.item_id as id,
                e.item_name as description,
                e.item_total_cost as amount,
                g.group_name,
                e.date_bought as created_at
            FROM expense_item e
            JOIN expense_list el ON e.list_id = el.list_id
            JOIN "Group" g ON el.group_id = g.group_id
            JOIN groupprofile gp ON g.group_id = gp.group_id
            WHERE gp.profile_id = %s
            ORDER BY e.date_bought DESC
            LIMIT %s
        """, (user_id, limit))
        
        expenses = cursor.fetchall()
        
        result = []
        for exp in expenses:
            result.append({
                "id": exp[0],
                "description": exp[1],
                "amount": float(exp[2]),
                "group_name": exp[3],
                "created_at": exp[4].isoformat() if exp[4] else None,
                "emoji": "💵"
            })
        
        return result
    finally:
        cursor.close()
        conn.close()