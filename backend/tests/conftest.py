import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app from api_connection.py
from app.api_connection import app


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


@pytest.fixture
def mock_db_connection():
    """Mock database connection"""
    mock_conn = Mock()
    mock_cursor = Mock()
    mock_conn.cursor.return_value.__enter__ = Mock(return_value=mock_cursor)
    mock_conn.cursor.return_value.__exit__ = Mock(return_value=False)
    return mock_conn, mock_cursor


@pytest.fixture
def auth_headers():
    """Generate authentication headers with a valid token"""
    from app.security import create_access_token
    token = create_access_token(user_id=1)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_user():
    """Sample user data"""
    return {
        "profile_id": 1,
        "profile_name": "Test User",
        "email": "test@example.com",
        "password": "TestPassword123!",
        "picture": "https://example.com/pic.jpg",
        "birthday": "1990-01-01",
        "phone": "+1234567890"
    }


@pytest.fixture
def sample_group():
    """Sample group data"""
    return {
        "group_id": 1,
        "group_name": "Test Group",
        "group_photo": "https://example.com/group.jpg",
        "join_code": "ABC12345",
        "date_created": "2024-01-01T00:00:00"
    }


@pytest.fixture
def sample_shopping_list():
    """Sample shopping list data"""
    return {
        "list_id": 1,
        "list_name": "Weekly Groceries",
        "group_id": 1,
        "date_created": "2024-01-01T00:00:00",
        "date_closed": None
    }


@pytest.fixture
def sample_chore():
    """Sample chore data"""
    return {
        "chore_id": 1,
        "group_id": 1,
        "name": "Clean kitchen",
        "due_date": "2024-12-31",
        "notes": "Don't forget the counters",
        "created_at": "2024-01-01T00:00:00"
    }


@pytest.fixture
def sample_event():
    """Sample event data"""
    return {
        "event_id": 1,
        "event_name": "Movie Night",
        "event_datetime_start": "2024-12-25T19:00:00",
        "event_datetime_end": "2024-12-25T22:00:00",
        "event_location": "Living Room",
        "event_notes": "Bring snacks"
    }


@pytest.fixture(autouse=True)
def reset_mocks():
    """Reset all mocks after each test"""
    yield
    patch.stopall()