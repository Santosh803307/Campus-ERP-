from fastapi import HTTPException, status
from app.core.redis import redis_client


async def check_rate_limit(
    key: str,
    limit: int = 5,
    window: int = 60,
):
    """
    Redis-based rate limiter.

    limit  = maximum requests allowed
    window = time window in seconds
    """

    try:
        current_count = await redis_client.incr(key)

        if current_count == 1:
            await redis_client.expire(
                key,
                window,
            )

        if current_count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Too many requests. "
                    "Please try again later."
                ),
            )

    except HTTPException:
        raise

    except Exception:
        # Authentication should not fail only because
        # Redis rate limiting is temporarily unavailable.
        return