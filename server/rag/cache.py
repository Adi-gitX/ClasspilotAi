"""
Response Cache for ClassPilot AI
Caches AI responses to reduce API token usage by 30-50%
"""
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple, List


class ResponseCache:
    """LRU cache for AI responses with TTL"""
    
    def __init__(self, max_size: int = 500, ttl_hours: int = 24):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.ttl = timedelta(hours=ttl_hours)
        self.hits = 0
        self.misses = 0
    
    def _hash_key(self, question: str, context_summary: str) -> str:
        """Create cache key from question and context hash"""
        # Normalize question
        normalized = question.lower().strip()
        # Include context length as part of key (not full content)
        content = f"{normalized}:{len(context_summary)}:{context_summary[:100]}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get(self, question: str, context_summary: str = "") -> Optional[Tuple[str, List[str]]]:
        """Get cached response if exists and not expired"""
        key = self._hash_key(question, context_summary)
        
        if key in self.cache:
            entry = self.cache[key]
            if datetime.now() - entry['created'] < self.ttl:
                self.hits += 1
                # Update access time for LRU
                entry['accessed'] = datetime.now()
                return entry['answer'], entry['sources']
            else:
                # Expired, remove
                del self.cache[key]
        
        self.misses += 1
        return None
    
    def set(self, question: str, context_summary: str, answer: str, sources: List[str]):
        """Cache a response"""
        # Evict if full
        if len(self.cache) >= self.max_size:
            self._evict_oldest()
        
        key = self._hash_key(question, context_summary)
        self.cache[key] = {
            'answer': answer,
            'sources': sources,
            'created': datetime.now(),
            'accessed': datetime.now()
        }
    
    def _evict_oldest(self):
        """Remove least recently accessed entry"""
        if not self.cache:
            return
        oldest_key = min(
            self.cache.keys(), 
            key=lambda k: self.cache[k]['accessed']
        )
        del self.cache[oldest_key]
    
    def clear(self):
        """Clear all cached responses"""
        self.cache = {}
        self.hits = 0
        self.misses = 0
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': f"{hit_rate:.1f}%",
            'ttl_hours': self.ttl.total_seconds() / 3600
        }


# Global cache instance
response_cache = ResponseCache()
