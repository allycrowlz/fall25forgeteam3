import logging
from fastapi import APIRouter, HTTPException, Depends
from psycopg2.extras import RealDictCursor
from psycopg2 import Error as PsycopgError
from backend.db.connection import get_connection
from backend.db.pydanticmodels import ShoppingList, ListItem, CreateShoppingList, ShoppingListWithItems, AddItem, UpdateItem
from backend.app.auth_routes import get_current_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["shopping-lists"]
)

# Dependency for database connection
def get_db():
    """Get database connection per request"""
    conn = get_connection()
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

@router.get("/lists/recent")
async def get_recent_lists(
    limit: int = 3,
    user_id: str = Depends(get_current_user_from_token),
    conn = Depends(get_db)
):
    """Get recent shopping lists for the current user across all their groups"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    sl.list_id as id,
                    sl.list_name as name,
                    g.group_name,
                    sl.date_created
                FROM "shopping_list" sl
                JOIN "Group" g ON sl.group_id = g.group_id
                JOIN groupprofile gp ON g.group_id = gp.group_id
                WHERE gp.profile_id = %s
                ORDER BY sl.date_created DESC
                LIMIT %s
            """, (int(user_id), limit))
            
            rows = cur.fetchall()
            
            return [
                {
                    "id": row['id'],
                    "name": row['name'],
                    "group_name": row['group_name'],
                    "emoji": "📝"
                }
                for row in rows
            ]
            
    except PsycopgError as e:
        logger.error(f"Database error fetching recent lists: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error fetching recent lists: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

# POST /api/groups/:id/lists
@router.post("/groups/{group_id}/lists", response_model=ShoppingList, status_code=201)
async def create_shopping_list(
    group_id: int, 
    create_list: CreateShoppingList,
    conn = Depends(get_db)
):
    """Create a shopping list"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
            logger.info(f"Created shopping list {row['list_id']} for group {group_id}")
            return ShoppingList(**row)
            
    except HTTPException:
        raise
    except PsycopgError as e:
        conn.rollback()
        logger.error(f"Database error creating shopping list: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        conn.rollback()
        logger.error(f"Unexpected error creating shopping list: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

# GET /api/groups/:id/lists
@router.get("/groups/{group_id}/lists", response_model=list[ShoppingList])
async def get_lists(group_id: int, conn = Depends(get_db)):
    """Get all lists for a group"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT list_id, list_name, date_created, date_completed as date_closed, group_id
                FROM "shopping_list"
                WHERE group_id = %s
                ORDER BY date_created ASC
            """, (group_id,))

            rows = cur.fetchall()
            return [ShoppingList(**row) for row in rows]
            
    except PsycopgError as e:
        logger.error(f"Database error fetching lists: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error fetching lists: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

# GET /api/lists/:id
@router.get("/lists/{list_id}", response_model=ShoppingListWithItems)
async def get_list_with_items(list_id: int, conn = Depends(get_db)):
    """Get a single list with all its items"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
    except PsycopgError as e:
        logger.error(f"Database error fetching list with items: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error fetching list with items: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

# POST /api/lists/:id/items
@router.post("/lists/{list_id}/items", response_model=ListItem, status_code=201)
async def add_item_to_list(
    list_id: int, 
    add_item: AddItem,
    conn = Depends(get_db)
):
    """Add an item to a shopping list"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if list exists first
            cur.execute("""
                SELECT list_id FROM "shopping_list" WHERE list_id = %s
            """, (list_id,))
            
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="List not found")
            
            cur.execute("""
                INSERT INTO "shopping_item" (item_name, list_id, quantity, added_by_id, date_added, is_purchased)
                VALUES (%s, %s, %s, %s, NOW(), FALSE)
                RETURNING item_id, item_name, list_id, quantity as item_quantity, added_by_id as added_by, date_added, is_purchased as bought
            """, (add_item.item_name, list_id, add_item.item_quantity, add_item.added_by))
            
            conn.commit()
            row = cur.fetchone()
            logger.info(f"Added item {row['item_id']} to list {list_id}")
            return ListItem(**row)
            
    except HTTPException:
        raise
    except PsycopgError as e:
        conn.rollback()
        logger.error(f"Database error adding item: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        conn.rollback()
        logger.error(f"Unexpected error adding item: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

# PUT /api/items/:id
@router.put("/items/{item_id}", response_model=ListItem)
async def update_item(
    item_id: int, 
    item_to_update: UpdateItem,
    conn = Depends(get_db)
):
    """Update item - check/uncheck, edit name/quantity"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
            logger.info(f"Updated item {item_id}")
            return ListItem(**row)
            
    except HTTPException:
        raise
    except PsycopgError as e:
        conn.rollback()
        logger.error(f"Database error updating item: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        conn.rollback()
        logger.error(f"Unexpected error updating item: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

# DELETE /api/items/:id
@router.delete("/items/{item_id}", status_code=204)
async def delete_item(item_id: int, conn = Depends(get_db)):
    """Delete an item from a shopping list"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
            logger.info(f"Deleted item {item_id}")
            return None
            
    except HTTPException:
        raise
    except PsycopgError as e:
        conn.rollback()
        logger.error(f"Database error deleting item: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        conn.rollback()
        logger.error(f"Unexpected error deleting item: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

# DELETE /api/lists/:id
@router.delete("/lists/{list_id}", status_code=204)
async def delete_list(list_id: int, conn = Depends(get_db)):
    """Delete a shopping list"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
            logger.info(f"Deleted shopping list {list_id}")
            return None
            
    except HTTPException:
        raise
    except PsycopgError as e:
        conn.rollback()
        logger.error(f"Database error deleting list: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        conn.rollback()
        logger.error(f"Unexpected error deleting list: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")