# -*- coding: utf-8 -*-
"""Show the Lines Tiles showcase from this folder, in your browser.

    python serve.py          only this computer can see it (Ctrl+C to stop)
    python serve.py --lan    phones and computers on the same Wi-Fi can open it too

Needs only Python 3 (no packages). On Windows you can double-click show-tiles.bat.
"""
import argparse
import functools
import http.server
import os
import socket
import sys
import threading
import webbrowser


class Handler(http.server.SimpleHTTPRequestHandler):
    # some Windows setups map .js to text/plain in the registry; say what it really is
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map,
                          **{".js": "text/javascript", ".html": "text/html", ".png": "image/png"})

    def log_message(self, fmt, *args):         # keep the window quiet
        pass


def lan_address():
    """This computer's address on the local network (a UDP connect sends no packet)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("192.0.2.1", 80))           # a documentation-only address: never reached
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def main():
    ap = argparse.ArgumentParser(description="Show the Lines Tiles showcase.")
    ap.add_argument("--port", type=int, default=8642)
    ap.add_argument("--lan", action="store_true", help="also reachable from the same Wi-Fi")
    args = ap.parse_args()
    here = os.path.dirname(os.path.abspath(__file__))
    host = "0.0.0.0" if args.lan else "127.0.0.1"
    try:
        httpd = http.server.ThreadingHTTPServer((host, args.port), functools.partial(Handler, directory=here))
    except OSError as e:
        print("Could not use port %d (%s). Try: python serve.py --port 8650" % (args.port, e))
        return 1
    url = "http://localhost:%d/showcase.html" % args.port
    print("Lines Tiles showcase:  " + url)
    if args.lan:
        ip = lan_address()
        print("On the same Wi-Fi:     " + ("http://%s:%d/showcase.html" % (ip, args.port) if ip else "(no network address found)"))
    print("The demo with every tile: http://localhost:%d/index.html" % args.port)
    print("Close this window or press Ctrl+C to stop.")
    threading.Timer(0.6, webbrowser.open, [url]).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
