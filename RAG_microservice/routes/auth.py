from fastapi import APIRouter, HTTPException, Response
from models.user import User, UserRegister, UserLogin
import bcrypt
from uuid import uuid4

authRouter = APIRouter()


@authRouter.post("/signup", status_code=201)
async def signup(body: UserRegister):
    try:
        existing_user = await User.find_one(User.email == body.email)
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
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@authRouter.post("/login")
async def login(body: UserLogin, response: Response):
    try:
        user = await User.find_one(User.email == body.email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        is_valid = await user.validate_password(body.password)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = await user.get_jwt()

        response.set_cookie(
            key="token",
            value=token,
            httponly=True,    # not accessible via JS
            secure=True,      # only sent over HTTPS
            samesite="strict", # CSRF protection
            max_age=86400,    # 1 day in seconds, matches JWT expiry
        )

        return {"message": "Login successful", "success": True}

    except HTTPException:
        raise

    except Exception as e:
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