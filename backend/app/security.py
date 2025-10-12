from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "secret-key-change-this-later"
ALGORITHM = "HS256"

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

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