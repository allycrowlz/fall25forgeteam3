from datetime import datetime, timedelta
from decimal import Decimal
from backend.db.connection import get_connection
from psycopg2.extras import RealDictCursor
from typing import List, Dict

# Import calendar integration
try:
    from backend.db.recurring_expense_calendar import (
        create_calendar_events_for_recurring_expense,
        delete_calendar_events_for_expense
    )
    CALENDAR_INTEGRATION_AVAILABLE = True
except ImportError:
    CALENDAR_INTEGRATION_AVAILABLE = False
    print("Warning: Calendar integration not available")

# ============================================================
# EXPENSE LIST OPERATIONS
# ============================================================

def create_expense_list(group_id: int, list_name: str) -> dict:
    """Create a new expense list"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO expense_list (list_name, group_id)
            VALUES (%s, %s)
            RETURNING list_id, list_name, group_id, date_created, date_closed
        """, (list_name, group_id))
        row = cur.fetchone()
        conn.commit()
        return dict(row)
    finally:
        cur.close()
        conn.close()

def get_group_expense_lists(group_id: int) -> List[dict]:
    """Get all expense lists for a group"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT * FROM expense_list 
            WHERE group_id = %s 
            ORDER BY date_created DESC
        """, (group_id,))
        return [dict(row) for row in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

# ============================================================
# EXPENSE ITEM OPERATIONS
# ============================================================

def create_expense_item(expense_data: dict, splits: List[dict]) -> dict:
    """Create expense and its splits in a transaction"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Insert expense
        cur.execute("""
            INSERT INTO expense_item (
                item_name, list_id, item_total_cost, notes, paid_by_id,
                is_recurring, recurring_frequency, recurring_end_date
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING item_id, item_name, list_id, item_total_cost, notes,
                      paid_by_id, date_created, is_recurring, recurring_frequency,
                      recurring_end_date, is_deleted
        """, (
            expense_data['item_name'],
            expense_data['list_id'],
            expense_data['item_total_cost'],
            expense_data.get('notes'),
            expense_data['paid_by_id'],
            expense_data.get('is_recurring', False),
            expense_data.get('recurring_frequency'),
            expense_data.get('recurring_end_date')
        ))
        expense = dict(cur.fetchone())
        item_id = expense['item_id']
        
        # Insert splits
        for split in splits:
            cur.execute("""
                INSERT INTO expense_split (item_id, profile_id, amount_owed)
                VALUES (%s, %s, %s)
            """, (item_id, split['profile_id'], split['amount_owed']))
        
        conn.commit()
        
        # Create calendar events for recurring expenses
        if CALENDAR_INTEGRATION_AVAILABLE and expense_data.get('is_recurring'):
            try:
                create_calendar_events_for_recurring_expense(item_id, expense_data)
            except Exception as e:
                print(f"Failed to create calendar events: {e}")
        
        return expense
    except Exception as e:
        conn.rollback()
        raise Exception(f"Failed to create expense: {e}")
    finally:
        cur.close()
        conn.close()

def get_expense_with_splits(item_id: int) -> dict:
    """Get expense with all its splits"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Get expense
        cur.execute("""
            SELECT e.*, p.profile_name as paid_by_name
            FROM expense_item e
            JOIN profile p ON e.paid_by_id = p.profile_id
            WHERE e.item_id = %s AND e.is_deleted = FALSE
        """, (item_id,))
        expense = cur.fetchone()
        if not expense:
            return None
        expense = dict(expense)
        
        # Get splits
        cur.execute("""
            SELECT s.*, p.profile_name, p.picture as profile_picture,
                   e.item_name, e.paid_by_id,
                   payer.profile_name as paid_by_name,
                   el.group_id
            FROM expense_split s
            JOIN profile p ON s.profile_id = p.profile_id
            JOIN expense_item e ON s.item_id = e.item_id
            JOIN profile payer ON e.paid_by_id = payer.profile_id
            JOIN expense_list el ON e.list_id = el.list_id
            WHERE s.item_id = %s
        """, (item_id,))
        expense['splits'] = [dict(row) for row in cur.fetchall()]
        
        return expense
    finally:
        cur.close()
        conn.close()

def get_group_expenses(group_id: int, include_deleted: bool = False) -> List[dict]:
    """Get all expenses for a group"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        deleted_filter = "" if include_deleted else "AND e.is_deleted = FALSE"
        cur.execute(f"""
            SELECT e.*, p.profile_name as paid_by_name, el.group_id
            FROM expense_item e
            JOIN profile p ON e.paid_by_id = p.profile_id
            JOIN expense_list el ON e.list_id = el.list_id
            WHERE el.group_id = %s {deleted_filter}
            ORDER BY e.date_created DESC
        """, (group_id,))
        return [dict(row) for row in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

def delete_expense(item_id: int) -> bool:
    """Soft delete an expense"""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE expense_item 
            SET is_deleted = TRUE 
            WHERE item_id = %s
        """, (item_id,))
        conn.commit()
        
        # Delete associated calendar events
        if CALENDAR_INTEGRATION_AVAILABLE:
            try:
                delete_calendar_events_for_expense(item_id)
            except Exception as e:
                print(f"Failed to delete calendar events: {e}")
        
        return cur.rowcount > 0
    finally:
        cur.close()
        conn.close()

# ============================================================
# EXPENSE SPLIT OPERATIONS
# ============================================================

def settle_split(split_id: int) -> dict:
    """Mark a split as settled"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            UPDATE expense_split
            SET is_settled = TRUE, date_settled = NOW()
            WHERE split_id = %s
            RETURNING *
        """, (split_id,))
        row = cur.fetchone()
        conn.commit()
        return dict(row) if row else None
    finally:
        cur.close()
        conn.close()

def get_user_splits(profile_id: int, group_id: int = None, settled: bool = None) -> List[dict]:
    """Get all splits involving a user, optionally filtered by group and settlement status"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        group_filter = "AND el.group_id = %s" if group_id else ""
        settled_filter = "AND s.is_settled = %s" if settled is not None else ""
        params = [profile_id, profile_id]
        if group_id:
            params.append(group_id)
        if settled is not None:
            params.append(settled)
            
        query = f"""
            SELECT s.*, p.profile_name, p.picture as profile_picture,
                   e.item_name, e.paid_by_id, e.item_total_cost, e.date_created as expense_date,
                   payer.profile_name as paid_by_name,
                   el.group_id, el.list_name
            FROM expense_split s
            JOIN profile p ON s.profile_id = p.profile_id
            JOIN expense_item e ON s.item_id = e.item_id
            JOIN profile payer ON e.paid_by_id = payer.profile_id
            JOIN expense_list el ON e.list_id = el.list_id
            WHERE (s.profile_id = %s OR e.paid_by_id = %s)
              AND e.is_deleted = FALSE
              {group_filter}
              {settled_filter}
            ORDER BY e.date_created DESC
        """
        cur.execute(query, params)
        return [dict(row) for row in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

# ============================================================
# BALANCE CALCULATIONS
# ============================================================

def get_user_balance(profile_id: int, group_id: int = None) -> dict:
    """Calculate user's balance (what they owe and are owed)"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Amount others owe me (I paid, they owe, excluding myself)
        if group_id:
            cur.execute("""
                SELECT COALESCE(SUM(s.amount_owed), 0) as total
                FROM expense_split s
                JOIN expense_item e ON s.item_id = e.item_id
                JOIN expense_list el ON e.list_id = el.list_id
                WHERE e.paid_by_id = %s 
                  AND s.profile_id != %s
                  AND s.is_settled = FALSE
                  AND e.is_deleted = FALSE
                  AND el.group_id = %s
            """, (profile_id, profile_id, group_id))
        else:
            cur.execute("""
                SELECT COALESCE(SUM(s.amount_owed), 0) as total
                FROM expense_split s
                JOIN expense_item e ON s.item_id = e.item_id
                JOIN expense_list el ON e.list_id = el.list_id
                WHERE e.paid_by_id = %s 
                  AND s.profile_id != %s
                  AND s.is_settled = FALSE
                  AND e.is_deleted = FALSE
            """, (profile_id, profile_id))
        owed_to_me = cur.fetchone()['total']
        
        # Amount I owe others (they paid, I owe)
        if group_id:
            cur.execute("""
                SELECT COALESCE(SUM(s.amount_owed), 0) as total
                FROM expense_split s
                JOIN expense_item e ON s.item_id = e.item_id
                JOIN expense_list el ON e.list_id = el.list_id
                WHERE s.profile_id = %s 
                  AND e.paid_by_id != %s
                  AND s.is_settled = FALSE
                  AND e.is_deleted = FALSE
                  AND el.group_id = %s
            """, (profile_id, profile_id, group_id))
        else:
            cur.execute("""
                SELECT COALESCE(SUM(s.amount_owed), 0) as total
                FROM expense_split s
                JOIN expense_item e ON s.item_id = e.item_id
                JOIN expense_list el ON e.list_id = el.list_id
                WHERE s.profile_id = %s 
                  AND e.paid_by_id != %s
                  AND s.is_settled = FALSE
                  AND e.is_deleted = FALSE
            """, (profile_id, profile_id))
        i_owe = cur.fetchone()['total']
        
        return {
            'profile_id': profile_id,
            'total_owed_to_me': float(owed_to_me),
            'total_i_owe': float(i_owe),
            'net_balance': float(owed_to_me - i_owe)
        }
    finally:
        cur.close()
        conn.close()

def get_user_balances_by_person(profile_id: int, group_id: int = None) -> List[dict]:
    """Get breakdown of balances with each person"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if group_id:
            cur.execute("""
                WITH owed_to_me AS (
                    SELECT s.profile_id, SUM(s.amount_owed) as amount
                    FROM expense_split s
                    JOIN expense_item e ON s.item_id = e.item_id
                    JOIN expense_list el ON e.list_id = el.list_id
                    WHERE e.paid_by_id = %s 
                      AND s.profile_id != %s
                      AND s.is_settled = FALSE
                      AND e.is_deleted = FALSE
                      AND el.group_id = %s
                    GROUP BY s.profile_id
                ),
                i_owe AS (
                    SELECT e.paid_by_id as profile_id, SUM(s.amount_owed) as amount
                    FROM expense_split s
                    JOIN expense_item e ON s.item_id = e.item_id
                    JOIN expense_list el ON e.list_id = el.list_id
                    WHERE s.profile_id = %s 
                      AND e.paid_by_id != %s
                      AND s.is_settled = FALSE
                      AND e.is_deleted = FALSE
                      AND el.group_id = %s
                    GROUP BY e.paid_by_id
                )
                SELECT 
                    COALESCE(otm.profile_id, io.profile_id) as profile_id,
                    p.profile_name,
                    p.picture as profile_picture,
                    COALESCE(otm.amount, 0) - COALESCE(io.amount, 0) as amount
                FROM owed_to_me otm
                FULL OUTER JOIN i_owe io ON otm.profile_id = io.profile_id
                JOIN profile p ON p.profile_id = COALESCE(otm.profile_id, io.profile_id)
                WHERE COALESCE(otm.amount, 0) - COALESCE(io.amount, 0) != 0
                ORDER BY amount DESC
            """, (profile_id, profile_id, group_id, profile_id, profile_id, group_id))
        else:
            cur.execute("""
                WITH owed_to_me AS (
                    SELECT s.profile_id, SUM(s.amount_owed) as amount
                    FROM expense_split s
                    JOIN expense_item e ON s.item_id = e.item_id
                    JOIN expense_list el ON e.list_id = el.list_id
                    WHERE e.paid_by_id = %s 
                      AND s.profile_id != %s
                      AND s.is_settled = FALSE
                      AND e.is_deleted = FALSE
                    GROUP BY s.profile_id
                ),
                i_owe AS (
                    SELECT e.paid_by_id as profile_id, SUM(s.amount_owed) as amount
                    FROM expense_split s
                    JOIN expense_item e ON s.item_id = e.item_id
                    JOIN expense_list el ON e.list_id = el.list_id
                    WHERE s.profile_id = %s 
                      AND e.paid_by_id != %s
                      AND s.is_settled = FALSE
                      AND e.is_deleted = FALSE
                    GROUP BY e.paid_by_id
                )
                SELECT 
                    COALESCE(otm.profile_id, io.profile_id) as profile_id,
                    p.profile_name,
                    p.picture as profile_picture,
                    COALESCE(otm.amount, 0) - COALESCE(io.amount, 0) as amount
                FROM owed_to_me otm
                FULL OUTER JOIN i_owe io ON otm.profile_id = io.profile_id
                JOIN profile p ON p.profile_id = COALESCE(otm.profile_id, io.profile_id)
                WHERE COALESCE(otm.amount, 0) - COALESCE(io.amount, 0) != 0
                ORDER BY amount DESC
            """, (profile_id, profile_id, profile_id, profile_id))
        return [dict(row) for row in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

# ============================================================
# STATISTICS
# ============================================================

def get_expense_stats(profile_id: int, group_id: int = None, weeks: int = 4) -> dict:
    """Get expense statistics for charts"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        group_filter = "AND el.group_id = %s" if group_id else ""
        params = [profile_id]
        if group_id:
            params.append(group_id)
        
        # Weekly expenses
        cur.execute(f"""
            SELECT 
                DATE_TRUNC('week', e.date_created) as week_start,
                SUM(e.item_total_cost) as total
            FROM expense_item e
            JOIN expense_list el ON e.list_id = el.list_id
            WHERE e.paid_by_id = %s
              AND e.is_deleted = FALSE
              AND e.date_created >= NOW() - INTERVAL '{weeks} weeks'
              {group_filter}
            GROUP BY week_start
            ORDER BY week_start
        """, params)
        weekly = [dict(row) for row in cur.fetchall()]
        
        # Monthly expenses (last 6 months)
        cur.execute(f"""
            SELECT 
                DATE_TRUNC('month', e.date_created) as month_start,
                SUM(e.item_total_cost) as total
            FROM expense_item e
            JOIN expense_list el ON e.list_id = el.list_id
            WHERE e.paid_by_id = %s
              AND e.is_deleted = FALSE
              AND e.date_created >= NOW() - INTERVAL '6 months'
              {group_filter}
            GROUP BY month_start
            ORDER BY month_start
        """, params)
        monthly = [dict(row) for row in cur.fetchall()]
        
        # Total spent
        cur.execute(f"""
            SELECT COALESCE(SUM(e.item_total_cost), 0) as total
            FROM expense_item e
            JOIN expense_list el ON e.list_id = el.list_id
            WHERE e.paid_by_id = %s
              AND e.is_deleted = FALSE
              {group_filter}
        """, params)
        total_spent = cur.fetchone()['total']
        
        return {
            'total_spent': float(total_spent),
            'weekly_expenses': weekly,
            'monthly_expenses': monthly
        }
    finally:
        cur.close()
        conn.close()