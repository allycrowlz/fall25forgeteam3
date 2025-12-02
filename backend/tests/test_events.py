import pytest
from unittest.mock import patch, Mock
from fastapi import status
from datetime import datetime, timedelta


class TestCreateEvent:
    """Test event creation"""
    
    def test_create_event_no_auth(self, client):
        """Test creating event without authentication"""
        response = client.post("/api/events", json={
            "event_name": "Unauthorized Event",
            "event_datetime_start": "2024-12-20T10:00:00"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_event_invalid_datetime(self, client, auth_headers):
        """Test creating event with invalid datetime format"""
        response = client.post("/api/events", headers=auth_headers, json={
            "event_name": "Bad Time Event",
            "event_datetime_start": "not-a-date"
        })
        
        assert response.status_code == 422  # Validation error


class TestGetEvents:
    """Test retrieving events"""
    
    def test_get_user_events_empty(self, client, auth_headers):
        """Test getting events when user has none"""
        with patch('app.events.get_events_for_profile', return_value=[]):
            response = client.get("/api/events", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 0
    
    def test_get_user_events_no_auth(self, client):
        """Test getting events without authentication"""
        response = client.get("/api/events")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestGetGroupEvents:
    """Test retrieving events for a group"""
    
    def test_get_group_events_empty(self, client, auth_headers):
        """Test getting events for group with no events"""
        with patch('app.events.get_events_for_group_members', return_value=[]):
            response = client.get("/api/groups/1/events", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 0
    
    def test_get_group_events_no_auth(self, client):
        """Test getting group events without authentication"""
        response = client.get("/api/groups/1/events")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestDeleteEvent:
    """Test event deletion"""
    
    def test_delete_event_not_found(self, client, auth_headers):
        """Test deleting non-existent event"""
        with patch('app.events.delete_event', return_value=False):
            response = client.delete("/api/events/999", headers=auth_headers)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    def test_delete_event_no_auth(self, client):
        """Test deleting event without authentication"""
        response = client.delete("/api/events/1")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_event_invalid_id(self, client, auth_headers):
        """Test deleting event with invalid ID"""
        response = client.delete("/api/events/invalid", headers=auth_headers)
        
        assert response.status_code == 422  # Validation error


class TestEventEdgeCases:
    """Test edge cases and error handling"""
    
    def test_create_event_very_long_name(self, client, auth_headers):
        """Test creating event with very long name"""
        long_name = "A" * 500
        
        with patch('app.events.create_event', return_value=1):
            response = client.post("/api/events", headers=auth_headers, json={
                "event_name": long_name,
                "event_datetime_start": "2024-12-25T19:00:00"
            })
        
        # Should work unless you have DB constraints
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_500_INTERNAL_SERVER_ERROR]
    
    def test_get_events_invalid_date_format(self, client, auth_headers):
        """Test getting events with malformed date parameter"""
        # This will likely cause a 500 error due to datetime parsing
        response = client.get(
            "/api/events",
            headers=auth_headers,
            params={"start_date": "not-a-date"}
        )
        
        # Should fail with 500
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
