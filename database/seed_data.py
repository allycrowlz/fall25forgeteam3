from connection import get_connection
from datetime import datetime, timedelta
import random

def clear_all_data():
    """Clear all existing data from tables (for fresh seeding)"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("Clearing existing data...")
    
    # Delete in reverse order due to foreign keys
    cursor.execute("DELETE FROM expense_split")
    cursor.execute("DELETE FROM expense_item")
    cursor.execute("DELETE FROM expense_list")
    cursor.execute("DELETE FROM choreassignee")
    cursor.execute("DELETE FROM chore")
    cursor.execute("DELETE FROM groupprofile")
    cursor.execute("DELETE FROM profileevent")
    cursor.execute("DELETE FROM event")
    cursor.execute("DELETE FROM \"Group\"")
    cursor.execute("DELETE FROM profile")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("Data cleared successfully")


def seed_profiles():
    """Create test user profiles"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("Seeding profiles...")
    
    profiles = [
        ("Ari Pokony", "ari@northeastern.edu", "hashed_password_123", "https://i.pravatar.cc/150?img=1", "2003-05-15"),
        ("Sarah Chen", "sarah.chen@northeastern.edu", "hashed_password_456", "https://i.pravatar.cc/150?img=2", "2003-08-22"),
        ("Marcus Johnson", "marcus.j@northeastern.edu", "hashed_password_789", "https://i.pravatar.cc/150?img=3", "2002-12-10"),
        ("Emily Rodriguez", "emily.r@northeastern.edu", "hashed_password_abc", "https://i.pravatar.cc/150?img=4", "2003-03-18"),
        ("James Kim", "james.kim@northeastern.edu", "hashed_password_def", "https://i.pravatar.cc/150?img=5", "2003-07-05"),
        ("Olivia Martinez", "olivia.m@northeastern.edu", "hashed_password_ghi", "https://i.pravatar.cc/150?img=6", "2002-11-30"),
        ("David Park", "david.park@northeastern.edu", "hashed_password_jkl", "https://i.pravatar.cc/150?img=7", "2003-01-25"),
        ("Sophia Taylor", "sophia.t@northeastern.edu", "hashed_password_mno", "https://i.pravatar.cc/150?img=8", "2003-09-12"),
    ]
    
    profile_ids = []
    for profile in profiles:
        cursor.execute("""
            INSERT INTO profile (profile_name, email, password_hash, picture, birthday)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING profile_id
        """, profile)
        profile_ids.append(cursor.fetchone()[0])
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Created {len(profile_ids)} profiles")
    return profile_ids


def seed_groups(profile_ids):
    """Create test groups"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("Seeding groups...")
    
    groups = [
        ("Mission Hill Apartment", "https://i.pravatar.cc/300?img=10", "MSNHL2024"),
        ("Northeastern Study Group", "https://i.pravatar.cc/300?img=11", "STUDY2024"),
        ("Off-Campus House", "https://i.pravatar.cc/300?img=12", "HOUSE2024"),
    ]
    
    group_ids = []
    for group in groups:
        cursor.execute("""
            INSERT INTO "Group" (group_name, group_photo, join_code)
            VALUES (%s, %s, %s)
            RETURNING group_id
        """, group)
        group_ids.append(cursor.fetchone()[0])
    
    # Add members to groups
    # Group 1: Mission Hill Apartment (4 people)
    group1_members = profile_ids[:4]
    cursor.execute("""
        INSERT INTO groupprofile (group_id, profile_id, role)
        VALUES (%s, %s, 'admin')
    """, (group_ids[0], group1_members[0]))
    
    for member_id in group1_members[1:]:
        cursor.execute("""
            INSERT INTO groupprofile (group_id, profile_id, role)
            VALUES (%s, %s, 'member')
        """, (group_ids[0], member_id))
    
    # Group 2: Study Group (5 people)
    group2_members = profile_ids[2:7]
    cursor.execute("""
        INSERT INTO groupprofile (group_id, profile_id, role)
        VALUES (%s, %s, 'admin')
    """, (group_ids[1], group2_members[0]))
    
    for member_id in group2_members[1:]:
        cursor.execute("""
            INSERT INTO groupprofile (group_id, profile_id, role)
            VALUES (%s, %s, 'member')
        """, (group_ids[1], member_id))
    
    # Group 3: Off-Campus House (3 people)
    group3_members = profile_ids[5:]
    cursor.execute("""
        INSERT INTO groupprofile (group_id, profile_id, role)
        VALUES (%s, %s, 'admin')
    """, (group_ids[2], group3_members[0]))
    
    for member_id in group3_members[1:]:
        cursor.execute("""
            INSERT INTO groupprofile (group_id, profile_id, role)
            VALUES (%s, %s, 'member')
        """, (group_ids[2], member_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Created {len(group_ids)} groups with members")
    return group_ids, [group1_members, group2_members, group3_members]


def seed_chores(group_ids, group_members):
    """Create test chores"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("Seeding chores...")
    
    now = datetime.now()
    
    # Group 1 chores (Mission Hill Apartment)
    chores_group1 = [
        ("Take out trash", now - timedelta(days=2), now + timedelta(days=1), "Recycling and regular trash"),
        ("Clean kitchen", now - timedelta(days=1), now + timedelta(days=2), "Wipe counters, sweep floor"),
        ("Buy groceries", now, now + timedelta(days=3), "Check shared grocery list"),
        ("Vacuum living room", now - timedelta(days=5), now - timedelta(days=2), "Already overdue!"),
        ("Clean bathroom", now, now + timedelta(days=7), "Toilet, sink, shower"),
    ]
    
    chore_ids = []
    for chore in chores_group1:
        cursor.execute("""
            INSERT INTO chore (group_id, name, assigned_date, due_date, notes)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING chore_id
        """, (group_ids[0], chore[0], chore[1], chore[2], chore[3]))
        chore_ids.append(cursor.fetchone()[0])
    
    # Assign chores to group 1 members
    # Chore 1: assigned to member 1, completed
    cursor.execute("""
        INSERT INTO choreassignee (profile_id, chore_id, individual_status)
        VALUES (%s, %s, 'completed')
    """, (group_members[0][0], chore_ids[0]))
    
    # Chore 2: assigned to member 2, pending
    cursor.execute("""
        INSERT INTO choreassignee (profile_id, chore_id, individual_status)
        VALUES (%s, %s, 'pending')
    """, (group_members[0][1], chore_ids[1]))
    
    # Chore 3: assigned to members 1 and 3, both pending
    cursor.execute("""
        INSERT INTO choreassignee (profile_id, chore_id, individual_status)
        VALUES (%s, %s, 'pending')
    """, (group_members[0][0], chore_ids[2]))
    cursor.execute("""
        INSERT INTO choreassignee (profile_id, chore_id, individual_status)
        VALUES (%s, %s, 'pending')
    """, (group_members[0][2], chore_ids[2]))
    
    # Chore 4: assigned to member 4, pending (overdue)
    cursor.execute("""
        INSERT INTO choreassignee (profile_id, chore_id, individual_status)
        VALUES (%s, %s, 'pending')
    """, (group_members[0][3], chore_ids[3]))
    
    # Chore 5: assigned to member 2, pending
    cursor.execute("""
        INSERT INTO choreassignee (profile_id, chore_id, individual_status)
        VALUES (%s, %s, 'pending')
    """, (group_members[0][1], chore_ids[4]))
    
    # Group 2 chores (Study Group)
    chores_group2 = [
        ("Reserve study room", now, now + timedelta(days=1), "For Thursday study session"),
        ("Prepare presentation slides", now - timedelta(days=3), now + timedelta(days=4), "Slides for final project"),
    ]
    
    for chore in chores_group2:
        cursor.execute("""
            INSERT INTO chore (group_id, name, assigned_date, due_date, notes)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING chore_id
        """, (group_ids[1], chore[0], chore[1], chore[2], chore[3]))
        chore_id = cursor.fetchone()[0]
        
        # Assign to first member of group 2
        cursor.execute("""
            INSERT INTO choreassignee (profile_id, chore_id, individual_status)
            VALUES (%s, %s, 'pending')
        """, (group_members[1][0], chore_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Created {len(chores_group1) + len(chores_group2)} chores")


def seed_expenses(group_ids, group_members):
    """Create test expenses"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("Seeding expenses...")
    
    now = datetime.now()
    
    # Create expense lists
    cursor.execute("""
        INSERT INTO expense_list (list_name, group_id, date_created)
        VALUES (%s, %s, %s)
        RETURNING list_id
    """, ("October Expenses", group_ids[0], now - timedelta(days=10)))
    list_id_1 = cursor.fetchone()[0]
    
    cursor.execute("""
        INSERT INTO expense_list (list_name, group_id, date_created)
        VALUES (%s, %s, %s)
        RETURNING list_id
    """, ("Utilities - October", group_ids[0], now - timedelta(days=5)))
    list_id_2 = cursor.fetchone()[0]
    
    # Add expense items to list 1
    expenses_1 = [
        ("Costco groceries", 156.78, 1, "Weekly grocery haul", group_members[0][0]),
        ("WiFi bill", 65.00, 1, "Monthly internet", group_members[0][1]),
        ("Cleaning supplies", 42.50, 1, "Target run", group_members[0][2]),
        ("Pizza night", 38.00, 1, "Dominos order", group_members[0][3]),
    ]
    
    item_ids_1 = []
    for expense in expenses_1:
        cursor.execute("""
            INSERT INTO expense_item (item_name, list_id, item_total_cost, item_quantity, notes, bought_by_id, date_bought)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING item_id
        """, (expense[0], list_id_1, expense[1], expense[2], expense[3], expense[4], now - timedelta(days=random.randint(1, 8))))
        item_ids_1.append(cursor.fetchone()[0])
    
    # Split expenses for list 1 (4 people in group 1)
    num_members = len(group_members[0])
    for item_id in item_ids_1:
        # Get the cost
        cursor.execute("SELECT item_total_cost FROM expense_item WHERE item_id = %s", (item_id,))
        total_cost = cursor.fetchone()[0]
        split_amount = round(total_cost / num_members, 2)
        
        for member_id in group_members[0]:
            cursor.execute("""
                INSERT INTO expense_split (item_id, profile_id, amount_owed, is_active)
                VALUES (%s, %s, %s, %s)
            """, (item_id, member_id, split_amount, True))
    
    # Add expense items to list 2
    expenses_2 = [
        ("Electricity bill", 120.00, 1, "National Grid", group_members[0][0]),
        ("Gas bill", 45.00, 1, "National Grid", group_members[0][1]),
    ]
    
    for expense in expenses_2:
        cursor.execute("""
            INSERT INTO expense_item (item_name, list_id, item_total_cost, item_quantity, notes, bought_by_id, date_bought)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING item_id
        """, (expense[0], list_id_2, expense[1], expense[2], expense[3], expense[4], now - timedelta(days=random.randint(1, 4))))
        item_id = cursor.fetchone()[0]
        
        # Split among all members
        total_cost = expense[1]
        split_amount = round(total_cost / num_members, 2)
        
        for member_id in group_members[0]:
            cursor.execute("""
                INSERT INTO expense_split (item_id, profile_id, amount_owed, is_active)
                VALUES (%s, %s, %s, %s)
            """, (item_id, member_id, split_amount, True))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("Created expense lists and items with splits")


def seed_events(profile_ids):
    """Create test events"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("Seeding events...")
    
    now = datetime.now()
    
    events = [
        ("Study Session - Algorithms", now + timedelta(days=2, hours=3), now + timedelta(days=2, hours=5), "Snell Library Room 302", "Bring laptop and notes"),
        ("Group Dinner", now + timedelta(days=5, hours=7), now + timedelta(days=5, hours=9), "Chicken Lou's", "Split the bill"),
        ("Apartment Cleaning Day", now + timedelta(days=1, hours=10), now + timedelta(days=1, hours=14), "Home", "Deep clean before parents visit"),
        ("Movie Night", now + timedelta(days=7, hours=8), now + timedelta(days=7, hours=11), "Living room", "Vote on movie in group chat"),
        ("Grocery Shopping", now + timedelta(days=3, hours=5), now + timedelta(days=3, hours=6), "Star Market", "Check the shared list"),
    ]
    
    event_ids = []
    for event in events:
        cursor.execute("""
            INSERT INTO event (event_name, event_datetime_start, event_datetime_end, event_location, event_notes)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING event_id
        """, event)
        event_ids.append(cursor.fetchone()[0])
    
    # Link events to profiles
    # Event 1: Study session with 3 people
    for profile_id in profile_ids[2:5]:
        cursor.execute("""
            INSERT INTO profileevent (profile_id, event_id)
            VALUES (%s, %s)
        """, (profile_id, event_ids[0]))
    
    # Event 2: Group dinner with 4 people
    for profile_id in profile_ids[:4]:
        cursor.execute("""
            INSERT INTO profileevent (profile_id, event_id)
            VALUES (%s, %s)
        """, (profile_id, event_ids[1]))
    
    # Event 3: Cleaning day with 4 people
    for profile_id in profile_ids[:4]:
        cursor.execute("""
            INSERT INTO profileevent (profile_id, event_id)
            VALUES (%s, %s)
        """, (profile_id, event_ids[2]))
    
    # Event 4: Movie night with 4 people
    for profile_id in profile_ids[:4]:
        cursor.execute("""
            INSERT INTO profileevent (profile_id, event_id)
            VALUES (%s, %s)
        """, (profile_id, event_ids[3]))
    
    # Event 5: Grocery shopping with 2 people
    for profile_id in profile_ids[:2]:
        cursor.execute("""
            INSERT INTO profileevent (profile_id, event_id)
            VALUES (%s, %s)
        """, (profile_id, event_ids[4]))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Created {len(event_ids)} events")


def seed_all():
    """Run all seed functions"""
    print("Starting database seeding...")
    print("=" * 50)
    
    clear_all_data()
    
    profile_ids = seed_profiles()
    group_ids, group_members = seed_groups(profile_ids)
    seed_chores(group_ids, group_members)
    seed_expenses(group_ids, group_members)
    seed_events(profile_ids)
    
    print("=" * 50)
    print("Database seeding complete!")
    print("\nTest Accounts:")
    print("  - ari@northeastern.edu")
    print("  - sarah.chen@northeastern.edu")
    print("  - marcus.j@northeastern.edu")
    print("\nGroups:")
    print("  - Mission Hill Apartment (4 members)")
    print("  - Northeastern Study Group (5 members)")
    print("  - Off-Campus House (3 members)")


if __name__ == "__main__":
    seed_all()