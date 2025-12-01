import bcrypt
from jose import jwt
from datetime import datetime, timedelta

# These should be moved to environment variables in production
SECRET_KEY = "secret-key-change-this-later"
ALGORITHM = "HS256"

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    # Convert password to bytes if it's a string
    if isinstance(password, str):
        password = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    try:
        # Convert to bytes if strings
        if isinstance(plain_password, str):
            plain_password = plain_password.encode('utf-8')
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        # Verify using bcrypt
        return bcrypt.checkpw(plain_password, hashed_password)
    except Exception as e:
        # Log the error but don't expose it to user
        print(f"Password verification error: {e}")
        # Return False to indicate password doesn't match (security best practice)
        return False

def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=30)
    data = {"sub": str(user_id), "exp": expire}
    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_token(token: str):
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        return user_id
    except:
        return None


if __name__ == "__main__":
    print("=== Testing Password Hashing ===")
    plain = "mySecurePassword123"
    hashed = get_password_hash(plain)
    print(f"Plain: {plain}")
    print(f"Hashed: {hashed}")
    print(f"Verify correct: {verify_password('mySecurePassword123', hashed)}")
    print(f"Verify wrong: {verify_password('wrongPassword', hashed)}")
    
    print("\n=== Testing JWT Token ===")
    token = create_access_token(user_id=123)
    print(f"Token for user_id=123: {token}")