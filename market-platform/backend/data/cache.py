from cachetools import TTLCache

# Cache for historical data (daily bars) - valid for 24 hours
history_cache = TTLCache(maxsize=100, ttl=86400)

# Cache for intraday data (e.g., 5-minute bars) - valid for 5 minutes
intraday_cache = TTLCache(maxsize=100, ttl=300)
