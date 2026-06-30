import yfinance as yf
stock = yf.Ticker("SBIN.NS")
print(stock.history(period="5d")[['Close']])
