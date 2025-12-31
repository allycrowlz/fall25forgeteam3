from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from backend.db.connection import get_connection
from psycopg2.extras import RealDictCursor

def create_calendar_events_for_recurring_expense(item_id: int, expense_data: dict):
    """
    Create calendar events for a recurring expense.
    Called after an expense is created.
    """
    if not expense_data.get('is_recurring'):
        return
    
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get expense details including group info and date_created
        cur.execute("""
            SELECT e.*, el.group_id, p.profile_name as paid_by_name
            FROM expense_item e
            JOIN expense_list el ON e.list_id = el.list_id
            JOIN profile p ON e.paid_by_id = p.profile_id
            WHERE e.item_id = %s
        """, (item_id,))
        expense = cur.fetchone()
        
        if not expense:
            print(f"❌ Expense {item_id} not found")
            return
        
        print(f"📅 Creating calendar events for expense: {expense['item_name']}")
        
        # Get all group members to add them as participants
        cur.execute("""
            SELECT profile_id
            FROM groupprofile
            WHERE group_id = %s
        """, (expense['group_id'],))
        group_members = [row['profile_id'] for row in cur.fetchall()]
        
        if not group_members:
            print(f"⚠️ No group members found for group {expense['group_id']}")
            return
        
        # Calculate recurring dates
        frequency = expense['recurring_frequency']
        
        # Use date_created from the fetched expense (it's now available)
        start_date = expense['date_created']
        if isinstance(start_date, datetime):
            current_date = start_date
        else:
            current_date = datetime.combine(start_date, datetime.min.time())
        
        # Convert end_date to datetime if it's a date object
        if expense['recurring_end_date']:
            if isinstance(expense['recurring_end_date'], datetime):
                end_date = expense['recurring_end_date']
            else:
                # It's a date object, convert to datetime
                end_date = datetime.combine(expense['recurring_end_date'], datetime.min.time())
        else:
            end_date = current_date + timedelta(days=365)  # Default 1 year
        
        events_created = 0
        
        print(f"📊 Creating events from {current_date} to {end_date} with frequency: {frequency}")
        
        while current_date <= end_date and events_created < 100:  # Max 100 events to prevent infinite loops
            # Create event for this occurrence
            event_name = f"{expense['item_name']} - ${float(expense['item_total_cost']):.2f}"
            event_notes = f"Recurring expense paid by {expense['paid_by_name']}"
            if expense['notes']:
                event_notes += f"\n\n{expense['notes']}"
            
            # Insert event with group_id
            cur.execute("""
                INSERT INTO event (
                    event_name,
                    event_datetime_start,
                    event_datetime_end,
                    event_notes,
                    event_location,
                    group_id
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING event_id
            """, (
                event_name,
                current_date,
                current_date + timedelta(hours=1),  # 1 hour duration
                event_notes,
                f"EXPENSE:{item_id}",
                expense['group_id']
            ))
            
            event_id = cur.fetchone()['event_id']
            
            # Add all group members to the event
            for member_id in group_members:
                cur.execute("""
                    INSERT INTO profileevent (profile_id, event_id)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                """, (member_id, event_id))
            
            events_created += 1
            
            # Calculate next occurrence
            if frequency == 'daily':
                current_date += timedelta(days=1)
            elif frequency == 'weekly':
                current_date += timedelta(weeks=1)
            elif frequency == 'monthly':
                current_date += relativedelta(months=1)
            elif frequency == 'yearly':
                current_date += relativedelta(years=1)
            else:
                print(f"⚠️ Unknown frequency: {frequency}")
                break  # Unknown frequency
        
        conn.commit()
        print(f"✅ Created {events_created} calendar events for recurring expense {item_id}")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error creating calendar events for recurring expense: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        cur.close()
        conn.close()


def delete_calendar_events_for_expense(item_id: int):
    """
    Delete all calendar events associated with an expense.
    Called when an expense is deleted.
    """
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # Find events created for this expense
        cur.execute("""
            DELETE FROM event
            WHERE event_location = %s
        """, (f"EXPENSE:{item_id}",))
        
        deleted_count = cur.rowcount
        conn.commit()
        print(f"✅ Deleted {deleted_count} calendar events for expense {item_id}")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error deleting calendar events: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()