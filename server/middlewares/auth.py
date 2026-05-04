from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import jwt
from os import getenv
from models.user import User

JWT_PRIVATE_KEY = getenv("JWT_PRIVATE_KEY")
EXCLUDED_ROUTES = ["/auth/signup", "/auth/login", "/retrieval/query"]

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Credentials": "true",
}

def cors_response(status_code: int, content: dict):
    return JSONResponse(status_code=status_code, content=content, headers=CORS_HEADERS)

async def userAuth(request: Request, call_next):
    print(f"PATH: '{request.url.path}' | EXCLUDED: {request.url.path in EXCLUDED_ROUTES}")
    print(f"PATH: {request.url.path} | UPGRADE: {request.headers.get('upgrade')}")
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.headers.get("upgrade", "").lower() == "websocket":
        print("WS request — skipping auth")
        return await call_next(request)

    if request.url.path in EXCLUDED_ROUTES:
        return await call_next(request)

    try:
        token = request.cookies.get("token")
        if not token:
            return cors_response(401, {"detail": "Not authenticated", "success": False})

        payload = jwt.decode(token, JWT_PRIVATE_KEY, algorithms=["HS256"])
        request.state.user_id = payload.get("_id")

        response = await call_next(request)
        return response

    except jwt.ExpiredSignatureError:
        return cors_response(401, {"detail": "Token expired", "success": False})

    except jwt.InvalidTokenError:
        return cors_response(401, {"detail": "Invalid token", "success": False})

    except Exception as e:
        return cors_response(500, {"detail": f"Internal server error: {str(e)}"})


def require_role(*roles: str):
    async def dependency(request: Request):
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")

        user = await User.get(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")

        request.state.user = user
        return user

    return dependency