"""Local-only preview and export server. Run: python3 server.py"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json, socket, subprocess, shutil, uuid, tempfile, threading, re
from urllib.parse import urlsplit, parse_qs

ROOT = Path(__file__).resolve().parent
EXPORTS = ROOT / 'exports'
SETTINGS_FILE = ROOT / '.export-settings.json'
SETTINGS_LOCK = threading.Lock()
PICKER_LOCK = threading.Lock()
try:
    SETTINGS = json.loads(SETTINGS_FILE.read_text())
except (OSError, ValueError):
    SETTINGS = {}

def export_directory():
    return Path(SETTINGS.get('directory', str(EXPORTS)))

def persist_settings():
    temporary = SETTINGS_FILE.with_suffix('.tmp')
    temporary.write_text(json.dumps(SETTINGS, ensure_ascii=False, indent=2))
    temporary.replace(SETTINGS_FILE)

def set_directory(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError('请输入文件夹完整路径')
    path = Path(value.strip()).expanduser()
    if not path.is_absolute():
        raise ValueError('请输入以 / 或 ~/ 开头的完整路径')
    path = path.resolve()
    path.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryFile(dir=path):
        pass
    with SETTINGS_LOCK:
        SETTINGS['directory'] = str(path)
        persist_settings()
    return path

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == '/api/export-directory':
            return self.reply(200, {'path': str(export_directory())})
        super().do_GET()

    def translate_path(self, path):
        url = urlsplit(path).path
        if url.startswith('/exports/'):
            name = url.removeprefix('/exports/')
            if not re.fullmatch(r'gradient-[a-f0-9]{12}\.(png|webp|webm|mp4|json)', name):
                return str(ROOT / '__missing_export__')
            return SETTINGS.get('files', {}).get(name, str(EXPORTS / name))
        return super().translate_path(path)

    def end_headers(self):
        parsed = urlsplit(self.path)
        if parsed.path.startswith('/exports/') and parse_qs(parsed.query).get('download') == ['1']:
            name = Path(parsed.path).name
            if all(c.isalnum() or c in '-.' for c in name):
                self.send_header('Content-Disposition', 'attachment; filename="'+name+'"')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def reply(self, code, value):
        body = json.dumps(value).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path not in ('/api/export/png','/api/export/webp','/api/export/webm','/api/export/mp4','/api/export/json','/api/export-directory','/api/choose-export-directory'):
            return self.reply(404, {'error':'Unknown export format'})
        origin = self.headers.get('Origin', '')
        if origin and origin not in ('http://localhost:8010','http://127.0.0.1:8010'):
            return self.reply(403, {'error':'Local origin required'})
        try:
            if self.path == '/api/choose-export-directory':
                if not PICKER_LOCK.acquire(blocking=False):
                    return self.reply(409, {'error':'文件夹选择窗口已打开，请完成或取消选择'})
                try:
                    helper = ROOT / '.runtime' / 'ExportFolderPicker.app' / 'Contents' / 'MacOS' / 'ExportFolderPicker'
                    source = ROOT / 'gradient-lab' / 'scripts' / 'choose-export-folder.swift'
                    if not helper.exists() or helper.stat().st_mtime < source.stat().st_mtime:
                        helper.parent.mkdir(parents=True, exist_ok=True)
                        subprocess.run(['swiftc',str(source),'-o',str(helper)],check=True,capture_output=True,timeout=180)
                    shutil.copyfile(ROOT / 'gradient-lab' / 'scripts' / 'folder-picker-Info.plist', helper.parent.parent / 'Info.plist')
                    result = subprocess.run([str(helper),str(export_directory())],check=True,capture_output=True,text=True,timeout=600)
                    selection = json.loads(result.stdout)
                    if selection.get('cancelled'):
                        return self.reply(200, {'cancelled':True,'path':str(export_directory())})
                    path = set_directory(selection.get('path'))
                    return self.reply(200, {'cancelled':False,'path':str(path)})
                finally:
                    PICKER_LOCK.release()
            length = int(self.headers.get('Content-Length', '0'))
            limit = 8192 if self.path == '/api/export-directory' else 256*1024*1024
            if not 0 < length <= limit:
                return self.reply(413, {'error':'文件为空或超过 256 MB'})
            data = self.rfile.read(length)
            if len(data) != length:
                return self.reply(400, {'error':'上传不完整'})
            if self.path == '/api/export-directory':
                try:
                    path = set_directory(json.loads(data).get('path'))
                    return self.reply(200, {'path': str(path)})
                except (ValueError, OSError) as error:
                    return self.reply(400, {'error': str(error)})
            destination = export_directory()
            ext = self.path.rsplit('/',1)[1]
            webm = data.startswith(bytes.fromhex('1a45dfa3'))
            mp4 = data[4:8] == b'ftyp'
            valid = {'png':data.startswith(b'\x89PNG\r\n\x1a\n'), 'webp':data[:4]==b'RIFF' and data[8:12]==b'WEBP', 'webm':webm, 'mp4':webm or mp4, 'json':False}
            if ext == 'json':
                json.loads(data); valid['json'] = True
            if not valid[ext]:
                return self.reply(400, {'error':'文件内容与格式不符'})
            destination.mkdir(parents=True, exist_ok=True)
            name = 'gradient-' + uuid.uuid4().hex[:12]
            output = destination / (name+'.'+ext)
            if ext == 'mp4':
                ffmpeg = shutil.which('ffmpeg')
                if not ffmpeg:
                    return self.reply(503, {'error':'MP4 转码需要本机安装 ffmpeg；可先导出 WebM'})
                source = destination / (name + '.input')
                source.write_bytes(data)
                try:
                    subprocess.run([ffmpeg,'-v','error','-i',str(source),'-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart','-an',str(output)],check=True,timeout=180,capture_output=True)
                finally:
                    source.unlink(missing_ok=True)
            else:
                output.write_bytes(data)
            with SETTINGS_LOCK:
                SETTINGS.setdefault('files', {})[output.name] = str(output)
                persist_settings()
            self.reply(200, {'url':'/exports/'+output.name,'path':str(output),'bytes':output.stat().st_size})
        except Exception as error:
            self.reply(500, {'error':'保存失败：'+str(error)[:200]})

if __name__ == '__main__':
    print('Shader Studio: http://127.0.0.1:8010/pro-0.html', flush=True)
    ThreadingHTTPServer(('127.0.0.1',8010),Handler).serve_forever()
