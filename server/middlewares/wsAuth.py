import jwt
from os import getenv
from fastapi import WebSocket
from models.user import User

JWT_PRIVATE_KEY = getenv("JWT_PRIVATE_KEY")

async def ws_auth(websocket: WebSocket):
    """Base auth — verifies token, returns user_id"""
    token = websocket.cookies.get("token")
    if not token:
        await websocket.close(code=1008)
        return None

    try:
        payload = jwt.decode(token, JWT_PRIVATE_KEY, algorithms=["HS256"])
        return payload.get("_id")
    except jwt.ExpiredSignatureError:
        await websocket.close(code=1008)
        return None
    except jwt.InvalidTokenError:
        await websocket.close(code=1008)
        return None

async def ws_require_role(websocket: WebSocket, *roles: str):
    """Auth + role check — returns user object"""
    user_id = await ws_auth(websocket)
    if not user_id:
        return None  # already closed

    user = await User.get(user_id)
    if not user:
        await websocket.close(code=1008)
        return None

    if user.role not in roles:
        await websocket.close(code=1003)
        return None

    return user