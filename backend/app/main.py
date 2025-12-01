import logfire
from fastapi import APIRouter, FastAPI, HTTPException, status, Header, Depends
from database.pydanticmodels import ProfileCreate, UserLogin, UserResponse, UserUpdate
from database.connection import get_connection
from security import get_password_hash, create_access_token, verify_password, decode_token

router = APIRouter()

# logfire.configure()
# logfire.info('Hello, {name}!', name='world')


async def get_current_user_from_token(authorization: str = Header(None)):
    """
    Dependency that extracts and validates the JWT token.
    Returns the user_id if valid, raises exception if not.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    try:
        token = authorization.split(" ")[1]
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user_id

@router.get("/")
async def root():
    return {"message": "Homebase API is running!"}

@router.post("/api/auth/register")
async def register(user_data: ProfileCreate):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT profile_id FROM profile WHERE email = %s",
        (user_data.email,)
    )
    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)

    cursor.execute("""
        INSERT INTO profile (profile_name, email, password_hash, picture, birthday)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING profile_id
    """, (
        user_data.profile_name,
        user_data.email,
        hashed_password,
        user_data.picture,
        user_data.birthday
    ))

    new_user_id = cursor.fetchone()[0]

    conn.commit()

    cursor.close()
    conn.close()

    access_token = create_access_token(new_user_id)
    
    return {
        "message": "User created successfully!",
        "profile_id": new_user_id,
        "email": user_data.email,
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/api/auth/login")
async def login(credentials: UserLogin):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT profile_id, password_hash FROM profile WHERE email = %s",
        (credentials.email,)
    )
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    profile_id = user[0]
    stored_password_hash = user[1]

    if not verify_password(credentials.password, stored_password_hash):
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(profile_id)

    cursor.close()
    conn.close()
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/api/auth/me", response_model=UserResponse)
async def get_current_user(user_id: str = Depends(get_current_user_from_token)):
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT profile_id, profile_name, email, picture, birthday FROM profile WHERE profile_id = %s",
        (user_id,)
    )
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
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
        birthday=user[4]
    )


@router.put("/api/users/me", response_model=UserResponse)
async def update_user(user_update: UserUpdate, user_id: str = Depends(get_current_user_from_token)):

    conn = get_connection()
    cursor = conn.cursor()
    
    update_fields = []
    update_values = []
    
    if user_update.profile_name is not None:
        update_fields.routerend("profile_name = %s")
        update_values.routerend(user_update.profile_name)
    
    if user_update.picture is not None:
        update_fields.routerend("picture = %s")
        update_values.routerend(user_update.picture)
    
    if user_update.birthday is not None:
        update_fields.routerend("birthday = %s")
        update_values.routerend(user_update.birthday)

    if not update_fields:
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_values.routerend(user_id)

    query = f"UPDATE profile SET {', '.join(update_fields)} WHERE profile_id = %s RETURNING profile_id, profile_name, email, picture, birthday"

    cursor.execute(query, update_values)
    updated_user = cursor.fetchone()
    
    conn.commit()
    cursor.close()
    conn.close()

    return UserResponse(
        profile_id=updated_user[0],
        profile_name=updated_user[1],
        email=updated_user[2],
        picture=updated_user[3],
        birthday=updated_user[4]
    )