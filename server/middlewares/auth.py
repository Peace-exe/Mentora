from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import jwt
from os import getenv
from models.user import User

JWT_PRIVATE_KEY = getenv("JWT_PRIVATE_KEY")
EXCLUDED_ROUTES = ["/auth/signup", "/auth/login", "/retrieval/query" ]

async def userAuth(request: Request, call_next):

    print(f"PATH: {request.url.path} | UPGRADE: {request.headers.get('upgrade')}")
    
    if request.headers.get("upgrade", "").lower() == "websocket":
        print("WS request — skipping auth")
        return await call_next(request)

    if request.url.path in EXCLUDED_ROUTES:
        return await call_next(request)
    
    try:
        token = request.cookies.get("token")
        if not token:
            return JSONResponse(status_code=401, content={"detail": "Not authenticated", "success": False})

        payload = jwt.decode(token, JWT_PRIVATE_KEY, algorithms=["HS256"])
        request.state.user_id = payload.get("_id")  # attach user_id to request state

        response = await call_next(request)
        return response

    except jwt.ExpiredSignatureError:
        return JSONResponse(status_code=401, content={"detail": "Token expired", "success": False})

    except jwt.InvalidTokenError:
        return JSONResponse(status_code=401, content={"detail": "Invalid token", "success": False})

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Internal server error: {str(e)}"})
    
def require_role(*roles: str):
    async def role_middleware(request: Request, call_next):
        user_id = request.state.user_id  
        
        user = await User.get(user_id)
        if not user:
            return JSONResponse(status_code=401, content={"detail": "User not found", "success": False})
        
        if user.role not in roles:
            return JSONResponse(status_code=403, content={"detail": "Forbidden", "success": False})

        request.state.user = user  
        
        response = await call_next(request)
        return response
    
    return role_middleware
