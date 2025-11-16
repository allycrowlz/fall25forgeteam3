import logging
from fastapi import APIRouter, HTTPException, status, Header, Depends
from psycopg2 import Error as PsycopgError
from jose import jwt, JWTError

from backend.db.pydanticmodels import ProfileCreate, UserLogin, UserResponse, UserUpdate
from backend.db.connection import get_connection
from backend.app.security import (
    get_password_hash, 
    create_access_token, 
    verify_password, 
    decode_token,
    SECRET_KEY,
    ALGORITHM
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Database dependency
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

# Auth dependency
async def get_current_user_from_token(authorization: str = Header(None)):
    """
    Dependency that extracts and validates the JWT token.
    Returns the user_id if valid, raises exception if not.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        # Expected format: "Bearer <token>"
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise ValueError("Invalid authentication scheme")
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user_id

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: ProfileCreate, conn = Depends(get_db)):
    """Register a new user account"""
    try:
        with conn.cursor() as cursor:
            # Check if email already exists
            cursor.execute(
                "SELECT profile_id FROM profile WHERE email = %s",
                (user_data.email,)
            )
            existing_user = cursor.fetchone()

            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Hash password
            hashed_password = get_password_hash(user_data.password)

            # Insert new user (including phone if provided)
            cursor.execute("""
                INSERT INTO profile (profile_name, email, password_hash, picture, birthday, phone)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING profile_id
            """, (
                user_data.profile_name,
                user_data.email,
                hashed_password,
                user_data.picture,
                user_data.birthday,
                user_data.phone if hasattr(user_data, 'phone') else None
            ))

            new_user_id = cursor.fetchone()[0]
            conn.commit()

            logger.info(f"New user registered: {new_user_id}")

            # Create access token
            access_token = create_access_token(new_user_id)
            
            return {
                "message": "User created successfully!",
                "profile_id": new_user_id,
                "email": user_data.email,
                "access_token": access_token,
                "token_type": "bearer"
            }
    
    except HTTPException:
        raise
    except PsycopgError as e:
        conn.rollback()
        logger.error(f"Database error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        conn.rollback()
        logger.error(f"Unexpected error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.post("/login")
async def login(credentials: UserLogin, conn = Depends(get_db)):
    """Login with email and password"""
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT profile_id, password_hash FROM profile WHERE email = %s",
                (credentials.email,)
            )
            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )

            profile_id = user[0]
            stored_password_hash = user[1]

            # Verify password
            if not verify_password(credentials.password, stored_password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )

            logger.info(f"User logged in: {profile_id}")

            # Create access token
            access_token = create_access_token(profile_id)
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "profile_id": profile_id
            }
    
    except HTTPException:
        raise
    except PsycopgError as e:
        logger.error(f"Database error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.post("/refresh")
async def refresh_token(authorization: str = Header(None), conn = Depends(get_db)):
    """
    Refresh an access token. Accepts an expired or soon-to-expire token
    and returns a new access token.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    try:
        token = authorization.split(" ")[1]
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    try:
        # Decode token without checking expiration
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM], 
            options={"verify_exp": False}
        )
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Verify user still exists
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT profile_id FROM profile WHERE profile_id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
        
        logger.info(f"Token refreshed for user: {user_id}")
        
        # Create new token
        new_access_token = create_access_token(int(user_id))
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
        
    except JWTError as e:
        logger.warning(f"JWT error during token refresh: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.post("/logout")
async def logout(user_id: str = Depends(get_current_user_from_token)):
    """
    Logout endpoint. Since JWTs are stateless, this mainly acknowledges
    the logout request. The client should clear the token.
    """
    logger.info(f"User logged out: {user_id}")
    return {
        "message": "Logged out successfully"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: str = Depends(get_current_user_from_token),
    conn = Depends(get_db)
):
    """Get current user profile"""
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT profile_id, profile_name, email, picture, birthday, phone FROM profile WHERE profile_id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            return UserResponse(
                profile_id=user[0],
                profile_name=user[1],
                email=user[2],
                picture=user[3],
                birthday=user[4].isoformat() if user[4] else None,
                phone=user[5]
            )
    
    except HTTPException:
        raise
    except PsycopgError as e:
        logger.error(f"Database error fetching user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.put("/me", response_model=UserResponse)
async def update_user(
    user_update: UserUpdate, 
    user_id: str = Depends(get_current_user_from_token),
    conn = Depends(get_db)
):
    """Update current user profile"""
    try:
        with conn.cursor() as cursor:
            # Build dynamic update query
            update_fields = []
            update_values = []
            
            if user_update.profile_name is not None:
                update_fields.append("profile_name = %s")
                update_values.append(user_update.profile_name)
            
            if user_update.picture is not None:
                update_fields.append("picture = %s")
                update_values.append(user_update.picture)
            
            if user_update.birthday is not None:
                update_fields.append("birthday = %s")
                update_values.append(user_update.birthday)
            
            if user_update.phone is not None:
                update_fields.append("phone = %s")
                update_values.append(user_update.phone)

            if not update_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            update_values.append(user_id)

            query = f"""
                UPDATE profile 
                SET {', '.join(update_fields)} 
                WHERE profile_id = %s 
                RETURNING profile_id, profile_name, email, picture, birthday, phone
            """

            cursor.execute(query, update_values)
            updated_user = cursor.fetchone()
            
            if not updated_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            conn.commit()
            
            logger.info(f"User updated: {user_id}")

            return UserResponse(
                profile_id=updated_user[0],
                profile_name=updated_user[1],
                email=updated_user[2],
                picture=updated_user[3],
                birthday=updated_user[4].isoformat() if updated_user[4] else None,
                phone=updated_user[5]
            )
    
    except HTTPException:
        raise
    except PsycopgError as e:
        conn.rollback()
        logger.error(f"Database error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        conn.rollback()
        logger.error(f"Unexpected error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )