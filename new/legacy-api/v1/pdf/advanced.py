import fitz # PyMuPDF
import json
from http.server import BaseHTTPRequestHandler
import io

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            # Creamos un stream del PDF recibido
            doc = fitz.open(stream=post_data, filetype="pdf")
            full_text = ""
            
            for page in doc:
                full_text += page.get_text()
                
            response_data = {
                "success": True,
                "text": full_text,
                "pages": doc.page_count,
                "metadata": doc.metadata
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": False,
                "error": str(e)
            }).encode())
        return
