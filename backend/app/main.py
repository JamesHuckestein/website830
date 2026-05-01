from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
import jwt

app = FastAPI(title="KoC Council 830 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_JWT_SECRET = "dev-secret-change-in-production!!"
_JWT_ALGORITHM = "HS256"

# Demo credentials — replaced by AWS Cognito in Part 7
_DEMO_CREDENTIALS: dict[str, str] = {
    "8301001": "faith830",
    "8301002": "charity830",
}

_DEMO_MEMBERS = [
    {"memberNumber": "8301001", "firstName": "James", "lastName": "Smith"},
    {"memberNumber": "8301002", "firstName": "John", "lastName": "Doe"},
]

_bearer = HTTPBearer()


class LoginRequest(BaseModel):
    membershipNumber: str
    passcode: str


def _require_auth(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    try:
        return jwt.decode(credentials.credentials, _JWT_SECRET, algorithms=[_JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login")
def login(body: LoginRequest):
    expected = _DEMO_CREDENTIALS.get(body.membershipNumber)
    if expected is None or expected != body.passcode:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode(
        {"memberNumber": body.membershipNumber},
        _JWT_SECRET,
        algorithm=_JWT_ALGORITHM,
    )
    return {"token": token}


@app.get("/members")
def get_members(_payload: dict = Depends(_require_auth)):
    return _DEMO_MEMBERS
