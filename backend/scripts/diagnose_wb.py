"""
Times every stage of a World Bank fetch so we can see WHERE the slowness is
(DNS, TCP connect, TLS, server response, or our own retry logic).

Run from backend/:
    uv run python scripts/diagnose_wb.py
    uv run python scripts/diagnose_wb.py --country IDN --start 1990 --end 2020 --repeat 2

Read-only: it makes plain GET requests, writes nothing, and does not import
the app (so it cannot be affected by app code).
"""

import argparse
import asyncio
import os
import socket
import ssl
import time
from urllib.parse import urlparse

import httpx

GDP = "NY.GDP.MKTP.KD"
GFCF = "NE.GDI.FTOT.KD"
BASE = "https://api.worldbank.org/v2/country"

p = argparse.ArgumentParser()
p.add_argument("--country", default="IDN")
p.add_argument("--start", type=int, default=1990)
p.add_argument("--end", type=int, default=2020)
p.add_argument("--repeat", type=int, default=2)
p.add_argument("--read-timeout", type=float, default=30.0, help="same value the app uses")
p.add_argument("--url-gdp", help="override URL (testing the script itself)")
p.add_argument("--url-gfcf", help="override URL (testing the script itself)")
args = p.parse_args()

PARAMS = {"date": f"{args.start}:{args.end}", "format": "json", "per_page": 1000}
URL_GDP = args.url_gdp or f"{BASE}/{args.country}/indicator/{GDP}"
URL_GFCF = args.url_gfcf or f"{BASE}/{args.country}/indicator/{GFCF}"
USE_PARAMS = not (args.url_gdp or args.url_gfcf)


def ms(t0):
    return f"{(time.perf_counter() - t0) * 1000:8.0f} ms"


def network_stages(url):
    u = urlparse(url)
    host, port = u.hostname, u.port or 443
    print(f"\n[1] DNS / TCP / TLS for {host}:{port}")
    t0 = time.perf_counter()
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except OSError as e:
        print(f"    DNS FAILED after {ms(t0)}: {e}")
        return
    print(f"    DNS lookup           {ms(t0)}   ({len(infos)} addresses)")
    seen = set()
    for family, _, _, _, sockaddr in infos:
        addr = sockaddr[0]
        if addr in seen:
            continue
        seen.add(addr)
        label = "IPv6" if family == socket.AF_INET6 else "IPv4"
        t1 = time.perf_counter()
        try:
            s = socket.socket(family, socket.SOCK_STREAM)
            s.settimeout(10)
            s.connect(sockaddr)
            tcp = ms(t1)
            t2 = time.perf_counter()
            ctx = ssl.create_default_context()
            ss = ctx.wrap_socket(s, server_hostname=host)
            print(f"    {label} {addr:<40} connect {tcp} | TLS {ms(t2)}")
            ss.close()
        except Exception as e:  # noqa: BLE001 - diagnostic tool, report everything
            print(f"    {label} {addr:<40} FAILED after {ms(t1)}: {type(e).__name__}: {e}")


async def timed_get(client, url, label):
    t0 = time.perf_counter()
    try:
        async with client.stream("GET", url, params=PARAMS if USE_PARAMS else None) as r:
            t_headers = time.perf_counter() - t0
            body = await r.aread()
            total = time.perf_counter() - t0
        print(f"    {label:<6} HTTP {r.status_code} | first byte {t_headers * 1000:7.0f} ms | total {total * 1000:7.0f} ms | {len(body) / 1024:6.1f} KB")
        return total
    except Exception as e:  # noqa: BLE001
        print(f"    {label:<6} FAILED after {ms(t0)}: {type(e).__name__}: {e}")
        return None


async def http_stages():
    timeout = httpx.Timeout(args.read_timeout, connect=10.0)
    for i in range(1, args.repeat + 1):
        print(f"\n[2.{i}] Fresh client (new connection), sequential: GDP then GFCF")
        async with httpx.AsyncClient(timeout=timeout) as c:
            t0 = time.perf_counter()
            await timed_get(c, URL_GDP, "GDP")
            await timed_get(c, URL_GFCF, "GFCF")
            print(f"    sequential total      {ms(t0)}   <- what the app does today")
        print(f"[3.{i}] Fresh client, concurrent: GDP and GFCF together")
        async with httpx.AsyncClient(timeout=timeout) as c:
            t0 = time.perf_counter()
            await asyncio.gather(timed_get(c, URL_GDP, "GDP"), timed_get(c, URL_GFCF, "GFCF"))
            print(f"    concurrent total      {ms(t0)}")


print("Proxy-related environment variables:",
      {k: v for k, v in os.environ.items() if k.upper() in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY")} or "none")
print(f"App retry policy (loader.py): read timeout {args.read_timeout:.0f}s x up to 3 attempts per series, "
      f"+1.5s/3s backoff, GDP and GFCF one after another")
network_stages(URL_GDP)
asyncio.run(http_stages())
print("\nHow to read this: a slow 'first byte' = the World Bank server is slow; slow DNS/connect/TLS = your network "
      "(try another network or disable VPN/antivirus web shield); IPv6 FAILED or slow but IPv4 fast = IPv6 problem.")
