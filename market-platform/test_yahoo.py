import urllib.request, json

url = 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=IN&scrIds=day_gainers_in&count=3'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
data = json.loads(urllib.request.urlopen(req, timeout=10).read())
quotes = data['finance']['result'][0]['quotes']
for q in quotes:
    print(f"{q['symbol']}: {q.get('longName','?')} -> {q.get('regularMarketChangePercent',0):.2f}%")

print("\n--- Losers ---")
url2 = 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=IN&scrIds=day_losers_in&count=3'
req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
data2 = json.loads(urllib.request.urlopen(req2, timeout=10).read())
quotes2 = data2['finance']['result'][0]['quotes']
for q in quotes2:
    print(f"{q['symbol']}: {q.get('longName','?')} -> {q.get('regularMarketChangePercent',0):.2f}%")
