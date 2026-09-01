"""
Rate limiting and optional API key auth for the Mushroompedia API.
- Per-IP rate limit: immediate 429 when over limit; short block window on abuse.
- Optional API key: when API_KEY env is set, require X-API-Key header (e.g. from frontend VITE_API_KEY).
  User routes under /api/me use Clerk JWT instead of the API key.
"""

import os
import time
from collections import defaultdict
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

# --- Config (env) ---
API_KEY = os.environ.get("API_KEY", "").strip()
RATE_LIMIT_REQUESTS = int(os.environ.get("RATE_LIMIT_REQUESTS", "80"))
RATE_LIMIT_WINDOW_SEC = int(os.environ.get("RATE_LIMIT_WINDOW_SEC", "60"))
BLOCK_WINDOW_SEC = int(os.environ.get("BLOCK_WINDOW_SEC", "300"))  # 5 min block when exceeded

SKIP_API_KEY_PREFIXES = (
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
    "/api/me",
)

# In-memory state (per process; resets on deploy)
_request_times: dict[str, list[float]] = defaultdict(list)
_blocked_until: dict[str, float] = {}


def _client_ip(request: Request) -> str:
    """Client IP; respect X-Forwarded-For when behind Railway/proxy."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _prune_old(times: list[float], window_sec: float) -> None:
    cutoff = time.monotonic() - window_sec
    while times and times[0] < cutoff:
        times.pop(0)


def _skip_api_key(path: str) -> bool:
    return any(path == p or path.startswith(p + "/") or path.startswith(p) for p in SKIP_API_KEY_PREFIXES)


class RateLimitAndAuthMiddleware(BaseHTTPMiddleware):
    """Apply rate limit and optional API key check. Returns 429/401 before hitting routes."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        ip = _client_ip(request)

        # 1) Block list (after exceeding limit)
        now = time.monotonic()
        if ip in _blocked_until:
            if now < _blocked_until[ip]:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests; try again later."},
                    headers={"Retry-After": str(max(1, int(_blocked_until[ip] - now)))},
                )
            del _blocked_until[ip]

        # 2) Optional API key (when API_KEY env is set). Clerk-owned /api/me skips this.
        if API_KEY and not _skip_api_key(request.url.path):
            key = request.headers.get("x-api-key", "").strip()
            if key != API_KEY:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid or missing API key."},
                )

        # 3) Rate limit (sliding window)
        times = _request_times[ip]
        _prune_old(times, RATE_LIMIT_WINDOW_SEC)
        if len(times) >= RATE_LIMIT_REQUESTS:
            _blocked_until[ip] = now + BLOCK_WINDOW_SEC
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded; try again later."},
                headers={"Retry-After": str(BLOCK_WINDOW_SEC)},
            )
        times.append(now)

        return await call_next(request)
