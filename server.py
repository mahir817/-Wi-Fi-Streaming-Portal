import os
import sys
import re
import socket
import mimetypes
from pathlib import Path
from flask import Flask, render_template, request, Response, jsonify, send_from_directory

# Support for PyInstaller
if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)

SUPPORTED_VIDEOS = {'.mp4', '.mkv', '.webm'}
SUPPORTED_IMAGES = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
SUPPORTED_AUDIO = {'.mp3', '.wav', '.ogg', '.m4a', '.flac'}
SUPPORTED_DOCS = {'.pdf', '.txt', '.md', '.csv', '.json', '.html', '.doc', '.docx', '.xls', '.xlsx'}

def get_local_ip():
    """Returns the local IPv4 address of the host machine."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def find_available_port(start_port=8080, max_port=8099):
    """Finds an available port starting from start_port up to max_port."""
    for port in range(start_port, max_port + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('0.0.0.0', port)) != 0:
                return port
    raise RuntimeError(f"No available ports between {start_port} and {max_port}")

@app.route('/')
def index():
    """Serves the main dashboard page."""
    return render_template('index.html')

@app.route('/player/<path:filename>')
def player(filename):
    """Serves the media viewer page."""
    file_path = MEDIA_DIR / filename
    if not file_path.is_file():
        return "File not found", 404
        
    ext = file_path.suffix.lower()
    if ext in SUPPORTED_VIDEOS:
        media_type = 'video'
    elif ext in SUPPORTED_IMAGES:
        media_type = 'image'
    elif ext in SUPPORTED_AUDIO:
        media_type = 'audio'
    else:
        media_type = 'unknown'
        
    return render_template('player.html', filename=filename, media_type=media_type)

@app.route('/api/media', methods=['GET'])
def get_media():
    """Scans the media directory and returns a JSON list of all files."""
    media_files = []
    
    if not MEDIA_DIR.exists():
        return jsonify(media_files)
        
    for f in MEDIA_DIR.iterdir():
        if f.is_file() and f.name != '.gitkeep':
            ext = f.suffix.lower()
            if ext in SUPPORTED_VIDEOS:
                file_type = "video"
            elif ext in SUPPORTED_IMAGES:
                file_type = "image"
            elif ext in SUPPORTED_AUDIO:
                file_type = "audio"
            elif ext in SUPPORTED_DOCS:
                file_type = "document"
            else:
                file_type = "other"
                
            media_files.append({"name": f.name, "type": file_type})
                
    # Sort files alphabetically
    media_files.sort(key=lambda x: x["name"])
    return jsonify(media_files)

@app.route('/stream/<path:filename>')
def stream(filename):
    """
    Streams media files with HTTP Range Requests support (206 Partial Content).
    Crucial for seeking/scrubbing in HTML5 video and audio players.
    """
    file_path = MEDIA_DIR / filename
    
    if not file_path.is_file():
        return "File not found", 404

    file_size = file_path.stat().st_size
    range_header = request.headers.get('Range', None)
    
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = 'application/octet-stream'

    # If not a range request, just serve the file normally
    if not range_header:
        return send_from_directory(MEDIA_DIR, filename, mimetype=mime_type)

    # Handle Range Request
    byte1, byte2 = 0, None
    m = re.search(r'bytes=(\d+)-(\d*)', range_header)
    g = m.groups()
    
    if g[0]: byte1 = int(g[0])
    if g[1]: byte2 = int(g[1])

    if byte2 is None:
        byte2 = file_size - 1
        
    length = byte2 - byte1 + 1

    with open(file_path, 'rb') as f:
        f.seek(byte1)
        data = f.read(length)

    rv = Response(data, 206, mimetype=mime_type, direct_passthrough=True)
    rv.headers.add('Content-Range', f'bytes {byte1}-{byte2}/{file_size}')
    rv.headers.add('Accept-Ranges', 'bytes')
    
    return rv

if __name__ == '__main__':
    try:
        import waitress
        use_waitress = True
    except ImportError:
        use_waitress = False
        
    port = find_available_port(8080)
    ip_addr = get_local_ip()
    
    print("=" * 50)
    print("🚀 LocalWeb is Running! 🚀")
    print("=" * 50)
    print(f"📡 Access it on this machine: http://localhost:{port}")
    print(f"📱 Open on any device in the same WiFi network:\n")
    print(f"      👉  http://{ip_addr}:{port}  👈\n")
    print("=" * 50)
    print("Press CTRL+C to stop the server.")
    
    if use_waitress:
        print("\nStarting with Waitress WSGI server for better performance...")
        waitress.serve(app, host='0.0.0.0', port=port, _quiet=True)
    else:
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
