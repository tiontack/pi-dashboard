#!/bin/bash
cd /Users/1112949/Desktop/PI/dashboard
exec python3 -c "
import http.server, socketserver, os

os.chdir('/Users/1112949/Desktop/PI/dashboard')

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

with socketserver.TCPServer(('0.0.0.0', 8765), NoCacheHandler) as httpd:
    httpd.serve_forever()
"
