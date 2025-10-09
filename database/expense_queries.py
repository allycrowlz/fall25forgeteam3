from datetime import datetime
import psycopg2
from .pydanticmodels import ExpenseItem, ExpenseItemCreate, ExpenseList

# Connect to your postgres DB
conn = psycopg2.connect(
        dbname="homebase_dev",
        user="homebase_dev",
        password="homebase_devforge25",
        host="5.161.238.246",
        port="5432"
    )


def get_all_expenses_in_list(list_id: int):
    
    """
    Returns all of the expenses in the expense list with the given list id
    as a pydantic model.
    """
    cur = conn.cursor()
    cur.execute("SELECT * FROM expense_item WHERE list_id = %s;", (list_id,))
    rows = cur.fetchall()
    columns = [description_attributes[0] 
            for description_attributes in cur.description]
    data = [dict(zip(columns, row)) for row in rows]
    expense_lists = [ExpenseItem(**item) for item in data]
    return expense_lists

def get_item_in_list(list_id: int, item_id: int):
    
    """
    Returns all of the expenses in the expense list with the given list id
    as a list of pydantic models 
    """
    cur = conn.cursor()
    cur.execute("SELECT * FROM expense_item " \
    "WHERE list_id = %s AND item_id = %s;", (list_id, item_id))
    row = cur.fetchone()
    columns = [description_attributes[0] 
               for description_attributes in cur.description]
    item = dict(zip(columns, row))
    expense = ExpenseItem(**item)
    return expense

def get_group_lists(group_id: int):
    
    """
    Returns all of the expense lists for a given group based on group id
    as a list of pydantic models
    """
    cur = conn.cursor()
    cur.execute("SELECT * FROM expense_list WHERE group_id = %s", (group_id,))
    rows= cur.fetchall()
    columns = [desc[0] for desc in cur.description]
    data = [dict(zip(columns, row)) for row in rows]
    lists = [ExpenseList(**expList) for expList in data]
    return lists

def delete_expense(item_id: int):

    """
    Deletes expenses of a given item id, regardless of quantity
    """

    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM expense_item WHERE item_id = %s", (item_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise Exception(e)

def create_expense(expense: ExpenseItemCreate):

    cur = conn.cursor()
    try:
        cur.execute("""INSERT INTO expense_item
        (item_name, list_id, item_total_cost,
        item_quantity, notes, bought_by_id, date_bought)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING item_id, date_bought          
         """, (expense.item_name,
               expense.list_id,
               expense.item_total_cost,
               expense.item_quantity,
               expense.notes,
               expense.bought_by_id,
               datetime.now()))

        item_id, date_bought = cur.fetchone()
        conn.commit()

        complete_expense: ExpenseItem = ExpenseItem(item_id=item_id,
                                                    date_bought=date_bought,
                                                    **expense.model_dump())
        
        return complete_expense
        
    except Exception as e:
        conn.rollback()
        raise Exception({e})

#print(records)
print(get_group_lists(0))
print(get_all_expenses_in_list(2))
# print(get_item_in_list(2, 1))

