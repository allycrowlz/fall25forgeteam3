from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor
from database import connection
from database.pydanticmodels import ShoppingList, ListItem, CreateShoppingList, ShoppingListWithItems, AddItem, UpdateItem

conn = connection.get_connection()

router = APIRouter()

# POST /api/groups/:id/lists
@router.post("/api/groups/{group_id}/lists")
async def create_shopping_list(group_id: int, create_list: CreateShoppingList):
    """Create a shopping list"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if group exists first
        cur.execute("""
            SELECT group_id FROM "Group" WHERE group_id = %s
        """, (group_id,))
        
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Group not found")

        cur.execute("""
            INSERT INTO "shopping_list" (list_name, group_id, date_created)
            VALUES (%s, %s, NOW())
            RETURNING list_id, list_name, date_created, date_completed as date_closed, group_id
        """, (create_list.list_name, group_id))
        
        conn.commit()
        row = cur.fetchone()
        return ShoppingList(**row)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

# GET /api/groups/:id/lists
@router.get("/api/groups/{group_id}/lists")
async def get_lists(group_id: int):
    """Get all lists for a group"""
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT list_id, list_name, date_created, date_completed as date_closed, group_id
            FROM "shopping_list"
            WHERE group_id = %s
            ORDER BY date_created ASC
        """, (group_id,))

        rows = cur.fetchall()
        return [ShoppingList(**row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

# GET /api/lists/:id
@router.get("/api/lists/{list_id}", response_model=ShoppingListWithItems)
async def get_list_with_items(list_id: int):
    """Get a single list with all its items"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT sl.list_id, sl.list_name, sl.date_created, sl.date_completed as date_closed, sl.group_id,
                si.item_id, si.item_name, si.quantity as item_quantity, si.added_by_id as added_by, si.date_added, si.is_purchased as bought
            FROM "shopping_list" sl
            LEFT JOIN "shopping_item" si ON sl.list_id = si.list_id
            WHERE sl.list_id = %s
            ORDER BY si.item_name DESC
        """, (list_id,))
        
        rows = cur.fetchall()
        
        if not rows:
            raise HTTPException(status_code=404, detail="List not found")
        
        # Get list info
        first_row = rows[0]
        shopping_list = {
            'list_id': first_row['list_id'],
            'list_name': first_row['list_name'],
            'date_created': first_row['date_created'],
            'date_closed': first_row['date_closed'],
            'group_id': first_row['group_id'],
            'items': []
        }
        
        # Build items list (skip if item_id is None)
        for row in rows:
            if row['item_id']:
                shopping_list['items'].append(ListItem(
                    item_id=row['item_id'],
                    item_name=row['item_name'],
                    list_id=row['list_id'],
                    item_quantity=row['item_quantity'],
                    added_by=row['added_by'],
                    date_added=row['date_added'],
                    bought=row['bought']
                ))
        
        return ShoppingListWithItems(**shopping_list)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

# POST /api/lists/:id/items
@router.post("/api/lists/{list_id}/items", response_model=ListItem)
async def add_item_to_list(list_id: int, add_item: AddItem):
    """Add an item to a shopping list"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if list exists first
        cur.execute("""
            SELECT list_id FROM shopping_list WHERE list_id = %s
        """, (list_id,))
        
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="List not found")
        
        cur.execute("""
            INSERT INTO shopping_item (item_name, list_id, quantity, added_by_id, date_added, is_purchased)
            VALUES (%s, %s, %s, %s, NOW(), FALSE)
            RETURNING item_id, item_name, list_id, quantity as item_quantity, added_by_id as added_by, date_added, is_purchased as bought
        """, (add_item.item_name, list_id, add_item.item_quantity, add_item.added_by))
        
        conn.commit()
        row = cur.fetchone()
        return ListItem(**row)
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

# PUT /api/items/:id
@router.put("/api/items/{item_id}", response_model=ListItem)
async def update_item(item_id: int, item_to_update: UpdateItem):
    """Update item - check/uncheck, edit name/quantity"""
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT item_id, item_name, list_id, quantity as item_quantity, added_by_id as added_by, date_added, is_purchased as bought
            FROM "shopping_item"
            WHERE item_id = %s
        """, (item_id,))
        
        existing_item = cur.fetchone()
        if not existing_item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Get fields to be updated
        update_fields = []
        params = []
        if item_to_update.item_name is not None:
            update_fields.append("item_name = %s")
            params.append(item_to_update.item_name)
        
        if item_to_update.item_quantity is not None:
            update_fields.append("quantity = %s")
            params.append(item_to_update.item_quantity)
        
        if item_to_update.bought is not None:
            update_fields.append("is_purchased = %s")
            params.append(item_to_update.bought)

        # Return existing item if nothing to update
        if not update_fields:
            return ListItem(**existing_item)
        
        params.append(item_id)

        # Execute update
        query = f"""
            UPDATE "shopping_item"
            SET {', '.join(update_fields)}
            WHERE item_id = %s
            RETURNING item_id, item_name, list_id, quantity as item_quantity, added_by_id as added_by, date_added, is_purchased as bought
        """
        cur.execute(query, params)
        conn.commit()
        
        row = cur.fetchone()
        return ListItem(**row)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

# DELETE /api/items/:id
@router.delete("/api/items/{item_id}", status_code=204)
async def delete_item(item_id: int):
    """Delete an item from a shopping list"""
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Check if item exists
        cur.execute("""
            SELECT item_id
            FROM "shopping_item"
            WHERE item_id = %s
        """, (item_id,))

        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Item not found")
        
        cur.execute("""
            DELETE FROM "shopping_item"
            WHERE item_id = %s
        """, (item_id,))

        conn.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()

# DELETE /api/lists/:id
@router.delete("/api/lists/{list_id}", status_code=204)
async def delete_list(list_id: int):
    """Delete a shopping list"""
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Check if list exists
        cur.execute("""
            SELECT list_id
            FROM "shopping_list"
            WHERE list_id = %s
        """, (list_id,))

        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="List not found")
        
        cur.execute("""
            DELETE FROM "shopping_list"
            WHERE list_id = %s
        """, (list_id,))

        conn.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cur.close()