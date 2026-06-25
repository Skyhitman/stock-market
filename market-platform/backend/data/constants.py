# Stock constants - lightweight, no heavy dependencies
STOCKS = {
    "IT": ["TCS.NS", "INFY.NS", "HCLTECH.NS"],
    "Pharma": ["SUNPHARMA.NS", "CIPLA.NS", "LUPIN.NS", "DIVISLAB.NS", "AUROPHARMA.NS"],
    "Banking": ["SBIN.NS", "HDFCBANK.NS", "ICICIBANK.NS", "AXISBANK.NS", "KOTAKBANK.NS", "CANBK.NS"],
    "Energy": ["RELIANCE.NS", "ONGC.NS", "IOC.NS", "BPCL.NS", "HPCL.NS"]
}
BENCHMARK = "^NSEI"

def get_all_tickers():
    tickers = [BENCHMARK]
    for sector, stock_list in STOCKS.items():
        tickers.extend(stock_list)
    return tickers
