import pytest
from unittest.mock import patch, Mock
from fastapi import status
from datetime import datetime, date


class TestGetChores:
    """Test retrieving chores"""
    
    def test_get_chore_not_found(self, client):
        """Test getting non-existent chore"""
        with patch('app.chores_routes.get_chore_by_id', return_value=None):
            response = client.get("/api/chores/999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    

class TestUpdateChore:
    """Test updating chores"""
    
    def test_update_chore_not_found(self, client):
        """Test updating non-existent chore"""
        with patch('app.chores_routes.update_chore', return_value=False):
            response = client.put("/api/chores/999", json={
                "group_id": 1,
                "name": "Updated",
                "due_date": "2025-01-01"
            })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestDeleteChore:
    """Test deleting chores"""
    
    def test_delete_chore_not_found(self, client):
        """Test deleting non-existent chore"""
        with patch('app.chores_routes.delete_chore', return_value=False):
            response = client.delete("/api/chores/999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestChoreAssignment:
    """Test chore assignment operations"""
    
    def test_unassign_chore_not_found(self, client):
        """Test unassigning non-existent assignment"""
        with patch('app.chores_routes.unassign_chore_from_profile', return_value=False):
            response = client.delete("/api/chores/999/unassign/2")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestChoreStatus:
    """Test chore status updates"""
    
    def test_update_status_invalid(self, client):
        """Test update with invalid status"""
        response = client.patch("/api/chores/1/status/2", json={
            "status": "invalid_status"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_update_status_not_found(self, client):
        """Test updating status of non-existent assignment"""
        with patch('app.chores_routes.update_chore_status', return_value=False):
            response = client.patch("/api/chores/999/status/2", json={
                "status": "completed"
            })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    
    def test_toggle_status_not_found(self, client):
        """Test toggling status of non-existent assignment"""
        with patch('app.chores_routes.toggle_chore_status', return_value=None):
            response = client.patch("/api/chores/999/toggle/2")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND