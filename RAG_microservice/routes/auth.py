from fastapi import APIRouter, HTTPException, Response
from models.user import User, UserRegister, UserLogin, UserResponse
import bcrypt
from uuid import uuid4
from debug_logger import log_error
from datetime import datetime, timedelta

authRouter = APIRouter()


@authRouter.post("/signup", status_code=201)
async def signup(body: UserRegister):
    try:
        existing_user = await User.find_one({"email": body.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()

        user = User(
            first_name=body.first_name.strip(),
            last_name=body.last_name.strip(),
            email=body.email,
            password=hashed_password,
        )
        await user.insert()

        return {"message": "User created successfully", "success": True}

    except HTTPException:
        raise

    except Exception as e:
        log_error(e)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@authRouter.post("/login")
async def login(body: UserLogin, response: Response):
    try:
        user = await User.find_one({"email": body.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        is_valid = await user.validate_password(body.password)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = await user.get_jwt()
        expiry_time = 86400
        expires_at = datetime.utcnow() + timedelta(seconds=expiry_time)

        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=expiry_time,  # seconds, not datetime
        )

        return {
            "message": "Login successful",
            "success": True,
            "data": UserResponse(**user.model_dump()),
            "expires_at": expires_at.isoformat()
        }

    except HTTPException:
        raise

    except Exception as e:
        log_error(e)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    
@authRouter.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="token")
    return {"message": "Logged out successfully", "success": True}


@authRouter.post("/admin/signup", status_code=201)
async def admin_signup(body: UserRegister):
    try:
        existing_user = await User.find_one(User.email == body.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_password = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()

        user = User(
            admin_id=str(uuid4()),
            first_name=body.first_name.strip(),
            last_name=body.last_name.strip(),
            email=body.email,
            password=hashed_password,
            role="admin",
        )
        await user.insert()

        return {"message": "Admin created successfully", "success": True}

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")