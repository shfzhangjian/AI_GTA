from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json

root = Path(__file__).parent
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root / 'capture'), **kwargs)
    def do_POST(self):
        names = {'/save-video':'raw.webm','/save-trace':'capture-trace.json'}
        if self.path not in names:
            self.send_error(404)
            return
        content = self.rfile.read(int(self.headers['Content-Length']))
        (root / names[self.path]).write_bytes(content)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"saved":true}')
        print(json.dumps({'saved': names[self.path], 'bytes':len(content)}), flush=True)

ThreadingHTTPServer(('127.0.0.1',8094),Handler).serve_forever()
