import pytest
from unittest.mock import patch, Mock
from fastapi import status


class TestRegistration:
    """Test user registration"""
    
    def test_register_success(self, client, mock_db_connection):
        """Test successful user registration"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock database responses
        mock_cursor.fetchone.side_effect = [None, (1,)]  # No existing user, then new user ID
        
        with patch('backend.app.auth_routes.get_connection', return_value=mock_conn):
            response = client.post("/api/auth/register", json={
                "profile_name": "New User",
                "email": "newuser@example.com",
                "password": "SecurePass123!",
                "picture": "https://example.com/pic.jpg",
                "birthday": "1990-01-01"
            })
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "access_token" in data
        assert data["email"] == "newuser@example.com"
        assert data["profile_id"] == 1
    
    def test_register_duplicate_email(self, client, mock_db_connection):
        """Test registration with existing email"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock existing user
        mock_cursor.fetchone.return_value = (1,)
        
        with patch('backend.app.auth_routes.get_connection', return_value=mock_conn):
            response = client.post("/api/auth/register", json={
                "profile_name": "Duplicate User",
                "email": "existing@example.com",
                "password": "SecurePass123!"
            })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_invalid_data(self, client):
        """Test registration with invalid data"""
        response = client.post("/api/auth/register", json={
            "profile_name": "",
            "email": "invalid-email",
            "password": "short"
        })
        
        assert response.status_code == 422  # Validation error


class TestLogin:
    """Test user login"""
    
    def test_login_success(self, client, mock_db_connection, sample_user):
        """Test successful login"""
        mock_conn, mock_cursor = mock_db_connection
        
        from backend.app.security import get_password_hash
        hashed_password = get_password_hash(sample_user["password"])
        
        # Mock user lookup
        mock_cursor.fetchone.return_value = (1, hashed_password)
        
        with patch('backend.app.auth_routes.get_connection', return_value=mock_conn):
            response = client.post("/api/auth/login", json={
                "email": sample_user["email"],
                "password": sample_user["password"]
            })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["profile_id"] == 1
    
    def test_login_invalid_email(self, client, mock_db_connection):
        """Test login with non-existent email"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock no user found
        mock_cursor.fetchone.return_value = None
        
        with patch('backend.app.auth_routes.get_connection', return_value=mock_conn):
            response = client.post("/api/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "AnyPassword123!"
            })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_wrong_password(self, client, mock_db_connection):
        """Test login with incorrect password"""
        mock_conn, mock_cursor = mock_db_connection
        
        from backend.app.security import get_password_hash
        correct_password = "CorrectPass123!"
        hashed_password = get_password_hash(correct_password)
        
        mock_cursor.fetchone.return_value = (1, hashed_password)
        
        with patch('backend.app.auth_routes.get_connection', return_value=mock_conn):
            response = client.post("/api/auth/login", json={
                "email": "test@example.com",
                "password": "WrongPassword123!"
            })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestGetCurrentUser:
    """Test getting current user profile"""
    
    def test_get_current_user_success(self, client, mock_db_connection, auth_headers, sample_user):
        """Test successful retrieval of current user"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock user data
        mock_cursor.fetchone.return_value = (
            sample_user["profile_id"],
            sample_user["profile_name"],
            sample_user["email"],
            sample_user["picture"],
            sample_user["birthday"],
            sample_user["phone"]
        )
        
    
    def test_get_current_user_no_auth(self, client):
        """Test getting current user without authentication"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalid_token_here"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUpdateUser:
    """Test updating user profile"""
    
    def test_update_user_success(self, client, mock_db_connection, auth_headers, sample_user):
        """Test successful user profile update"""
        mock_conn, mock_cursor = mock_db_connection
        
        updated_name = "Updated Name"
        mock_cursor.fetchone.return_value = (
            sample_user["profile_id"],
            updated_name,
            sample_user["email"],
            sample_user["picture"],
            sample_user["birthday"],
            sample_user["phone"]
        )
    
    def test_update_user_no_fields(self, client, auth_headers):
        """Test update with no fields provided"""
        response = client.put("/api/auth/me", headers=auth_headers, json={})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestTokenRefresh:
    """Test token refresh endpoint"""
    
    def test_refresh_token_success(self, client, mock_db_connection, auth_headers):
        """Test successful token refresh"""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock user exists
        mock_cursor.fetchone.return_value = (1,)
        
        with patch('backend.app.auth_routes.get_connection', return_value=mock_conn):
            response = client.post("/api/auth/refresh", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
    
    def test_refresh_token_no_header(self, client):
        """Test token refresh without authorization header"""
        response = client.post("/api/auth/refresh")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestLogout:
    """Test logout endpoint"""
    
    def test_logout_success(self, client, auth_headers):
        """Test successful logout"""
        response = client.post("/api/auth/logout", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()