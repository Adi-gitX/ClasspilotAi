"""
Rate Limiter Middleware for ClassPilot AI
Prevents API abuse and controls request rates
"""
from fastapi import Request, HTTPException
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List
import asyncio


class RateLimiter:
    """Token bucket rate limiter"""
    
    def __init__(
        self, 
        requests_per_minute: int = 60,
        burst_limit: int = 10
    ):
        self.requests: Dict[str, List[datetime]] = defaultdict(list)
        self.limit = requests_per_minute
        self.burst_limit = burst_limit
        self.window = timedelta(minutes=1)
        self._lock = asyncio.Lock()
    
    async def check(self, request: Request) -> bool:
        """Check if request is allowed, raises HTTPException if not"""
        client_ip = self._get_client_ip(request)
        
        async with self._lock:
            now = datetime.now()
            
            # Clean old requests outside window
            self.requests[client_ip] = [
                t for t in self.requests[client_ip] 
                if now - t < self.window
            ]
            
            recent_requests = len(self.requests[client_ip])
            
            # Check burst limit (last 5 seconds)
            burst_window = timedelta(seconds=5)
            recent_burst = sum(
                1 for t in self.requests[client_ip] 
                if now - t < burst_window
            )
            
            if recent_burst >= self.burst_limit:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded (burst)",
                        "retry_after": 5,
                        "message": "Too many requests in short time. Please slow down."
                    }
                )
            
            if recent_requests >= self.limit:
                # Calculate when they can retry
                oldest = min(self.requests[client_ip])
                retry_after = int((oldest + self.window - now).total_seconds())
                
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded",
                        "retry_after": max(1, retry_after),
                        "message": f"Limit of {self.limit} requests per minute exceeded."
                    }
                )
            
            # Record this request
            self.requests[client_ip].append(now)
            return True
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request, handling proxies"""
        # Check for forwarded header (behind proxy/load balancer)
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct client
        return request.client.host if request.client else "unknown"
    
    def get_stats(self, request: Request) -> dict:
        """Get rate limit stats for a client"""
        client_ip = self._get_client_ip(request)
        now = datetime.now()
        
        # Clean and count
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] 
            if now - t < self.window
        ]
        
        used = len(self.requests[client_ip])
        remaining = max(0, self.limit - used)
        
        return {
            "limit": self.limit,
            "used": used,
            "remaining": remaining,
            "reset_in_seconds": 60
        }


# Global rate limiter instance
rate_limiter = RateLimiter(requests_per_minute=60, burst_limit=10)
