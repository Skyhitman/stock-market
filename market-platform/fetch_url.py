import urllib.request, re
try:
    js = urllib.request.urlopen('https://frontend-nine-nu-21.vercel.app/assets/index-IplPIFsu.js').read().decode('utf-8')
    urls = set(re.findall(r'https://[^\"]*\.onrender\.com', js))
    print(urls)
except Exception as e:
    print(e)
