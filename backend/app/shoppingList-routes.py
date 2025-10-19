import psycopg2
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from datetime import datetime

app = FastAPI()

conn = psycopg2.connect(
    dbname="homebase_dev",
    user="homebase_dev",
    password="homebase_devforge25",
    host="5.161.238.246",
    port=5432
)

# Pydantic models
class ShoppingList(BaseModel):
    list_name: str
    list_id: int
    date_created: datetime
    date_closed: Optional[datetime] = None
    group_id: int
class ListItem(BaseModel):
    item_name: str
    item_id: int
    list_id: int
    item_quantity: Optional[int] = 1
    added_by: int
    date_added: datetime
    bought: bool
class CreateShoppingList(BaseModel):
    list_name: str
class ShoppingListWithItems(BaseModel):
    list_id: int
    list_name: str
    date_created: datetime
    date_closed: Optional[datetime] = None
    group_id: int
    items: list[ListItem] = []
class AddItem(BaseModel):
    item_name: str
    item_quantity: Optional[int] = 1
    added_by: int
class UpdateItem(BaseModel):
    item_name: Optional[str] = None
    item_quantity: Optional[int] = None
    bought: Optional[bool] = None

# POST /api/groups/:id/lists
@app.post("/api/groups/{group_id}/lists")
async def create_shopping_list(group_id: int, create_list: CreateShoppingList):
    """Create a shopping list"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if list exists first
        cur.execute("""
            SELECT group_id FROM group WHERE group_id = %s
        """, (group_id,))

        cur.execute("""
            INSERT INTO "shopping_list" (list_name, group_id, date_created)
            VALUES (%s, %s, NOW())
            RETURNING list_id, list_name, date_created, date_closed, group_id
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
@app.get("/api/groups/{group_id}/lists")
async def get_lists(group_id: int):
    """Get all lists for a group"""
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT list_id, list_name, date_created, date_closed, group_id
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
@app.get("/api/lists/{list_id}", response_model=ShoppingListWithItems)
async def get_list_with_items(list_id: int):
    """Get a single list with all its items"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT sl.list_id, sl.list_name, sl.date_created, sl.date_closed, sl.group_id,
                li.item_id, li.item_name, li.item_quantity, li.added_by, li.date_added, li.bought
            FROM "shopping_list" sl
            LEFT JOIN "list_item" li ON sl.list_id = li.list_id
            WHERE sl.list_id = %s
            ORDER BY li.item_name DESC
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
@app.post("/api/lists/{list_id}/items", response_model=ListItem)
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
            INSERT INTO list_item (item_name, list_id, item_quantity, added_by, date_added, bought)
            VALUES (%s, %s, %s, %s, NOW(), FALSE)
            RETURNING item_id, item_name, list_id, item_quantity, added_by, date_added, bought
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
@app.put("/api/items/{item_id}", response_model=ListItem)
async def update_item(item_id: int, item_to_update: UpdateItem):
    """Update item - check/uncheck, edit name/quantity"""
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT *
            FROM "list_item"
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
            update_fields.append("item_quantity = %s")
            params.append(item_to_update.item_quantity)
        
        if item_to_update.bought is not None:
            update_fields.append("bought = %s")
            params.append(item_to_update.bought)

        # Return existing item if nothing to update
        if not update_fields:
            return ListItem(**existing_item)
        
        params.append(item_id)

        # Execute update
        query = f"""
            UPDATE "list_item"
            SET {', '.join(update_fields)}
            WHERE item_id = %s
            RETURNING item_id, item_name, list_id, item_quantity, added_by, date_added, bought
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
@app.delete("/api/items/{item_id}", status_code=204)
async def delete_item(item_id: int):
    """Delete an item from a shopping list"""
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Check if item exists
        cur.execute("""
            SELECT item_id
            FROM "list_item"
            WHERE item_id = %s
        """, (item_id,))

        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Item not found")
        
        cur.execute("""
            DELETE FROM "list_item"
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
@app.delete("/api/lists/{list_id}", status_code=204)
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