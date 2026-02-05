from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenRefresh,
    GoogleAuthResponse,
    GoogleLinkResponse,
)
from app.services.auth import AuthService
from app.services.oauth import OAuthService
from app.dependencies import get_current_user
from app.models.user import User
from app.utils.security import create_access_token, create_refresh_token
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    auth_service = AuthService(db)
    user = await auth_service.register(user_data)
    return user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Login and receive access and refresh tokens."""
    auth_service = AuthService(db)
    return await auth_service.login(credentials)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token."""
    auth_service = AuthService(db)
    return await auth_service.refresh_token(token_data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    refresh_token: TokenRefresh | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Logout and invalidate tokens."""
    auth_service = AuthService(db)
    await auth_service.logout(
        credentials.credentials,
        refresh_token.refresh_token if refresh_token else None
    )


@router.get("/google", response_model=GoogleAuthResponse, status_code=status.HTTP_200_OK)
async def google_auth():
    """Initiate Google OAuth flow."""
    oauth_service = OAuthService()
    
    if not oauth_service.is_oauth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    authorization_url, _ = oauth_service.get_authorization_url()
    return GoogleAuthResponse(authorization_url=authorization_url)


@router.get("/google/callback")
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback."""
    oauth_service = OAuthService()
    auth_service = AuthService(db)
    settings = get_settings()
    
    if not oauth_service.is_oauth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    try:
        user_info = await oauth_service.get_google_user_info(code, state)
    except ValueError as e:
        error_url = f"{settings.frontend_url}/auth/error?error={str(e)}"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    
    email = user_info.get("email")
    name = user_info.get("name") or user_info.get("given_name") or email
    google_id = user_info.get("sub")
    
    if not email or not google_id:
        error_url = f"{settings.frontend_url}/auth/error?error=invalid_google_response"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google response"
        )
    
    assert isinstance(email, str)
    assert isinstance(name, str)
    
    user = await auth_service.get_or_create_oauth_user(email, name, google_id)
    
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # Redirect to frontend with tokens in hash fragment (client-side only)
    frontend_url = settings.frontend_url.rstrip('/')
    redirect_url = f"{frontend_url}/auth/callback#access_token={access_token}&refresh_token={refresh_token}"
    
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)


@router.get("/google/link", response_model=GoogleAuthResponse, status_code=status.HTTP_200_OK)
async def google_link(
    current_user: User = Depends(get_current_user),
):
    """Initiate Google OAuth link for authenticated user."""
    oauth_service = OAuthService()
    
    if not oauth_service.is_oauth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    authorization_url, _ = oauth_service.get_authorization_url()
    return GoogleAuthResponse(authorization_url=authorization_url)


@router.get("/google/link/callback", response_model=GoogleLinkResponse)
async def google_link_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth link callback for authenticated user."""
    oauth_service = OAuthService()
    auth_service = AuthService(db)
    
    if not oauth_service.is_oauth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    try:
        user_info = await oauth_service.get_google_user_info(code, state)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    
    google_id = user_info.get("sub")
    
    if not google_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google response"
        )
    
    try:
        await auth_service.link_google_account(current_user, google_id)
        return GoogleLinkResponse(success=True, message="Google account linked successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
