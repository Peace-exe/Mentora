import jwt
from os import getenv
from fastapi import WebSocket
from models.user import User

JWT_PRIVATE_KEY = getenv("JWT_PRIVATE_KEY")

async def ws_auth(websocket: WebSocket):
    await websocket.accept()  # sirf ek baar

    token = websocket.query_params.get("token")
    if not token:
        token = websocket.cookies.get("token")

    if not token:
        await websocket.close(code=1008)
        return None

    try:
        payload = jwt.decode(token, JWT_PRIVATE_KEY, algorithms=["HS256"])
        return payload.get("_id")
    except:
        await websocket.close(code=1008)
        return None

async def ws_require_role(websocket: WebSocket, *roles: str):
    user_id = await ws_auth(websocket)
    if not user_id:
        return None

    user = await User.get(user_id)
    if not user:
        await websocket.close(code=1008)
        return None

    if user.role not in roles:
        await websocket.close(code=1003)
        return None

    return user