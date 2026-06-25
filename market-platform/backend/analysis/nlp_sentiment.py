import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import html
import re
import logging
from typing import List, Dict

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    analyzer = SentimentIntensityAnalyzer()
except ImportError:
    analyzer = None
    logging.warning("vaderSentiment not installed. Using keyword-based fallback.")

# Keyword-based fallback sentiment when VADER is not available
POSITIVE_KEYWORDS = {
    'surge', 'surges', 'rally', 'rallies', 'gain', 'gains', 'rise', 'rises',
    'jump', 'jumps', 'soar', 'soars', 'bullish', 'profit', 'growth', 'upgrade',
    'outperform', 'buy', 'strong', 'record', 'high', 'boom', 'positive',
    'recovery', 'beat', 'beats', 'exceed', 'exceeds', 'up', 'upside',
}
NEGATIVE_KEYWORDS = {
    'fall', 'falls', 'drop', 'drops', 'crash', 'crashes', 'decline', 'declines',
    'loss', 'losses', 'bearish', 'sell', 'selloff', 'downgrade', 'weak',
    'slump', 'slumps', 'plunge', 'plunges', 'cut', 'cuts', 'low', 'negative',
    'warning', 'fear', 'risk', 'miss', 'misses', 'down', 'downside',
}


def _keyword_sentiment(text: str) -> float:
    """Simple keyword-based sentiment fallback."""
    if not text:
        return 0.0
    words = set(re.findall(r'\w+', text.lower()))
    pos = len(words & POSITIVE_KEYWORDS)
    neg = len(words & NEGATIVE_KEYWORDS)
    total = pos + neg
    if total == 0:
        return 0.0
    return (pos - neg) / total  # Range: -1.0 to 1.0


def _clean_html(text: str) -> str:
    """Remove HTML tags and unescape entities."""
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()


def fetch_and_analyze_news(ticker: str, limit: int = 5) -> List[Dict]:
    """
    Fetches recent news for a ticker using Google News RSS and runs
    sentiment analysis on the title.
    Returns a list of dicts: title, link, publisher, published_at, sentiment_score
    """
    # Build search query from ticker (e.g., "TCS.NS" -> "TCS NSE stock")
    clean_symbol = ticker.replace(".NS", "").replace(".BO", "")
    search_query = f"{clean_symbol} NSE stock"
    encoded_query = urllib.request.quote(search_query)
    rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"

    try:
        req = urllib.request.Request(rss_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        response = urllib.request.urlopen(req, timeout=10)
        xml_data = response.read().decode('utf-8')

        root = ET.fromstring(xml_data)
        channel = root.find('channel')
        if channel is None:
            return []

        items = channel.findall('item')
        results = []

        for item in items[:limit]:
            title_el = item.find('title')
            link_el = item.find('link')
            pub_date_el = item.find('pubDate')
            source_el = item.find('source')

            title = _clean_html(title_el.text) if title_el is not None and title_el.text else ""
            link = link_el.text if link_el is not None and link_el.text else ""
            publisher = source_el.text if source_el is not None and source_el.text else "Google News"

            # Parse publish date from RSS (RFC 2822 format)
            published_at = datetime.utcnow()
            if pub_date_el is not None and pub_date_el.text:
                try:
                    published_at = parsedate_to_datetime(pub_date_el.text).replace(tzinfo=None)
                except Exception:
                    pass

            # Sentiment analysis
            sentiment_score = 0.0
            if title:
                if analyzer:
                    scores = analyzer.polarity_scores(title)
                    sentiment_score = scores.get('compound', 0.0)
                else:
                    sentiment_score = _keyword_sentiment(title)

            results.append({
                "ticker": ticker,
                "title": title,
                "publisher": publisher,
                "link": link,
                "published_at": published_at,
                "sentiment_score": sentiment_score
            })

        return results
    except Exception as e:
        logging.error(f"Error fetching news for {ticker}: {e}")
        return []


def aggregate_news_sentiment(news_list: List[Dict]) -> float:
    """
    Given a list of news dictionaries, aggregate their sentiment score.
    Returns average score.
    """
    if not news_list:
        return 0.0

    total = sum(item["sentiment_score"] for item in news_list)
    return total / len(news_list)
