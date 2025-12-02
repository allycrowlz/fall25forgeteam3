import pytest
from unittest.mock import patch, Mock
from fastapi import status
from datetime import datetime


class TestCreateShoppingList:
    """Test creating shopping lists"""
    
    def test_create_list_success(self, client, mock_db_connection, auth_headers):
        """Test successful list creation"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock group exists and list creation
        mock_cursor.fetchone.side_effect = [
            (1,),  # Group exists
            {  # Created list
                "list_id": 1,
                "list_name": "Weekly Groceries",
                "date_created": datetime.now(),
                "date_closed": None,
                "group_id": 1
            }
        ]
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.post(
                "/api/groups/1/lists",
                json={"list_name": "Weekly Groceries"},
                headers=auth_headers
            )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["list_name"] == "Weekly Groceries"
        assert data["group_id"] == 1
    
    def test_create_list_group_not_found(self, client, mock_db_connection, auth_headers):
        """Test creating list for non-existent group"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock group doesn't exist
        mock_cursor.fetchone.return_value = None
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.post(
                "/api/groups/999/lists",
                json={"list_name": "Test List"},
                headers=auth_headers
            )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestGetShoppingLists:
    """Test retrieving shopping lists"""
    
    def test_get_group_lists(self, client, mock_db_connection):
        """Test getting all lists for a group"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock multiple lists
        mock_cursor.fetchall.return_value = [
            {
                "list_id": 1,
                "list_name": "Groceries",
                "date_created": datetime.now(),
                "date_closed": None,
                "group_id": 1
            },
            {
                "list_id": 2,
                "list_name": "Hardware",
                "date_created": datetime.now(),
                "date_closed": None,
                "group_id": 1
            }
        ]
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.get("/api/groups/1/lists")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert data[0]["list_name"] == "Groceries"
    
    def test_get_list_with_items(self, client, mock_db_connection):
        """Test getting a specific list with items"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock list with items
        mock_cursor.fetchall.return_value = [
            {
                "list_id": 1,
                "list_name": "Groceries",
                "date_created": datetime.now(),
                "date_closed": None,
                "group_id": 1,
                "item_id": 1,
                "item_name": "Milk",
                "item_quantity": 2,
                "added_by": 1,
                "date_added": datetime.now(),
                "bought": False
            },
            {
                "list_id": 1,
                "list_name": "Groceries",
                "date_created": datetime.now(),
                "date_closed": None,
                "group_id": 1,
                "item_id": 2,
                "item_name": "Bread",
                "item_quantity": 1,
                "added_by": 1,
                "date_added": datetime.now(),
                "bought": True
            }
        ]
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.get("/api/lists/1")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["list_id"] == 1
        assert len(data["items"]) == 2
    
    def test_get_list_not_found(self, client, mock_db_connection):
        """Test getting non-existent list"""
        mock_conn, mock_cursor = mock_db_connection
        
        mock_cursor.fetchall.return_value = []
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.get("/api/lists/999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_recent_lists(self, client, mock_db_connection, auth_headers):
        """Test getting recent lists for user"""
        mock_conn, mock_cursor = mock_db_connection
        
        mock_cursor.fetchall.return_value = [
            {
                "id": 1,
                "name": "Recent List 1",
                "group_name": "Test Group",
                "date_created": datetime.now()
            },
            {
                "id": 2,
                "name": "Recent List 2",
                "group_name": "Test Group",
                "date_created": datetime.now()
            }
        ]
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.get("/api/lists/recent", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) <= 3  # Default limit


class TestShoppingListItems:
    """Test shopping list item operations"""
    
    def test_add_item_success(self, client, mock_db_connection, auth_headers):
        """Test adding item to list"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock list exists and item creation
        mock_cursor.fetchone.side_effect = [
            (1,),  # List exists
            {  # Created item
                "item_id": 1,
                "item_name": "Milk",
                "list_id": 1,
                "item_quantity": 2,
                "added_by": 1,
                "date_added": datetime.now(),
                "bought": False
            }
        ]
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.post(
                "/api/lists/1/items",
                json={
                    "item_name": "Milk",
                    "item_quantity": 2,
                    "added_by": 1
                },
                headers=auth_headers
            )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["item_name"] == "Milk"
        assert data["item_quantity"] == 2
    
    def test_add_item_list_not_found(self, client, mock_db_connection, auth_headers):
        """Test adding item to non-existent list"""
        mock_conn, mock_cursor = mock_db_connection
        
        mock_cursor.fetchone.return_value = None
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.post(
                "/api/lists/999/items",
                json={
                    "item_name": "Milk",
                    "item_quantity": 1,
                    "added_by": 1
                },
                headers=auth_headers
            )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_item_success(self, client, mock_db_connection):
        """Test updating an item"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock existing item and update
        mock_cursor.fetchone.side_effect = [
            {  # Existing item
                "item_id": 1,
                "item_name": "Milk",
                "list_id": 1,
                "item_quantity": 2,
                "added_by": 1,
                "date_added": datetime.now(),
                "bought": False
            },
            {  # Updated item
                "item_id": 1,
                "item_name": "Milk",
                "list_id": 1,
                "item_quantity": 3,
                "added_by": 1,
                "date_added": datetime.now(),
                "bought": True
            }
        ]
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.put(
                "/api/items/1",
                json={
                    "item_quantity": 3,
                    "bought": True
                }
            )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["item_quantity"] == 3
        assert data["bought"] is True
    
    def test_update_item_not_found(self, client, mock_db_connection):
        """Test updating non-existent item"""
        mock_conn, mock_cursor = mock_db_connection
        
        mock_cursor.fetchone.return_value = None
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.put(
                "/api/items/999",
                json={"bought": True}
            )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_item_success(self, client, mock_db_connection):
        """Test deleting an item"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock item exists
        mock_cursor.fetchone.return_value = (1,)
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.delete("/api/items/1")
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_delete_item_not_found(self, client, mock_db_connection):
        """Test deleting non-existent item"""
        mock_conn, mock_cursor = mock_db_connection
        
        mock_cursor.fetchone.return_value = None
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.delete("/api/items/999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestDeleteShoppingList:
    """Test deleting shopping lists"""
    
    def test_delete_list_success(self, client, mock_db_connection):
        """Test successful list deletion"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock list exists
        mock_cursor.fetchone.return_value = (1,)
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.delete("/api/lists/1")
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_delete_list_not_found(self, client, mock_db_connection):
        """Test deleting non-existent list"""
        mock_conn, mock_cursor = mock_db_connection
        
        mock_cursor.fetchone.return_value = None
        
        with patch('backend.app.shopping_list_routes.get_connection', return_value=mock_conn):
            response = client.delete("/api/lists/999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND