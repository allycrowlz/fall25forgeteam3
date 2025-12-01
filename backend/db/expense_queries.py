from datetime import datetime
import psycopg2
from .pydanticmodels import ExpenseItem, ExpenseItemCreate, ExpenseList, ExpenseSplit
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

def create_split (split : ExpenseSplit):

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
        INSERT INTO expense_split
        (item_id,amount_owed, profile_id)
        VALUES (%s, %s, %s)
        RETURNING split_id
        """, (split.item_id, 
              split.amount_owed,
              split.profile_id))
        item_id = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        print("SUCCESS")
        return item_id
    except Exception as e: 
        cur.close()
        conn.rollback()
        conn.close()
        raise Exception(e)


def pay_split(split_id: int):

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            UPDATE expense_split
            SET is_active = false
            WHERE split_id = %s
            RETURNING split_id, item_id, is_active, amount_owed, profile_id, date_created
            """, (split_id,))
        result = cur.fetchone()
        complete_split = None
        if result is not None: 
            split, item_id, is_active, amount_owed, profile, date_created = result
            complete_split = ExpenseSplit(
                split_id=split,
                item_id=item_id, 
                is_active=is_active, 
                amount_owed=amount_owed,
                profile_id=profile, 
                date_created=date_created
            )
        conn.commit()
        cur.close()
        conn.close()
        print("SUCCESS")
        return complete_split
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        raise Exception(e)
    
def get_group_splits(group_id: int):
    
    conn = get_connection()
    cur = conn.cursor()

    try: 
        cur.execute("""
                    SELECT es.*
                    FROM expense_split es
                    JOIN expense_item e ON es.item_id = e.item_id
                    JOIN expense_list el ON el.list_id = e.list_id
                    JOIN GroupProfile gp ON es.profile_id = gp.profile_id
                    WHERE el.group_id = %s 
                    AND gp.group_id = %s
                    ORDER BY es.date_created DESC
                    """, (group_id, group_id))
        
        rows = cur.fetchall()
        columns = [description_attributes[0] 
                for description_attributes in cur.description]
        data = [dict(zip(columns, row)) for row in rows]
        splits = [ExpenseSplit(**data_val) for data_val in data]
        cur.close()
        conn.close()
        return splits
    except Exception as e:
        cur.close()
        conn.close()
        raise Exception(e)

class ExpenseSplitWithProfile(ExpenseSplit):
    profile_name: str
    item_name: str
    buyer: str

def get_profile_splits(profile_id: int):
    
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
                SELECT es.*, p.profile_name, e.item_name, buyer.profile_name as "buyer"
                FROM expense_split es
                JOIN profile p ON p.profile_id = es.profile_id
                JOIN expense_item e ON es.item_id = e.item_id
                JOIN profile buyer ON e.bought_by_id = buyer.profile_id
                WHERE es.profile_id = %s
                    OR e.bought_by_id = %s
                ORDER BY es.date_created DESC
                """, (profile_id, profile_id))
    

        rows = cur.fetchall()
        columns = [description_attributes[0] 
                for description_attributes in cur.description]
        data = [dict(zip(columns, row)) for row in rows]
        splits = [ExpenseSplitWithProfile(**data_val) for data_val in data]
        cur.close()
        conn.close()
        return splits
    except Exception as e:
        cur.close()
        conn.close()
        raise Exception(e)

def get_total_balance(profile_id: int):
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT COALESCE(SUM(amount_owed), 0) as total_balance
            FROM expense_split
            WHERE profile_id = %s AND is_active = true
            """, (profile_id,))
        
        result = cur.fetchone()
        total_balance = result[0] if result else 0
        
        return float(total_balance)
    
    except Exception as e:
        conn.rollback()
        raise e
    
    finally:
        cur.close()
        conn.close()
