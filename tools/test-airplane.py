# Full "airplane mode" test: Chrome reaches the internet only through a tiny proxy we can switch off.
import base64, json, os, select, socket, struct, subprocess, sys, tempfile, time, urllib.request, threading, http.server, socketserver, functools
SITE = sys.argv[1]; SHOT = sys.argv[2] if len(sys.argv) > 2 else None
PORT, PPORT, CPORT = [9400 + os.getpid() % 150 + k * 150 for k in range(3)]
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=SITE)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
OFFLINE = [False]
class Proxy(socketserver.BaseRequestHandler):
    def handle(self):
        c = self.request; head = b""
        while b"\r\n\r\n" not in head:
            d = c.recv(4096)
            if not d: return
            head += d
        line = head.split(b"\r\n")[0].decode()
        if OFFLINE[0] or not line.startswith("CONNECT "):
            c.sendall(b"HTTP/1.1 502 Offline\r\n\r\n"); return
        host, port = line.split()[1].split(":")
        try: up = socket.create_connection((host, int(port)), timeout=10)
        except Exception: c.sendall(b"HTTP/1.1 502 Bad\r\n\r\n"); return
        c.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
        socks = [c, up]
        while not OFFLINE[0]:
            r, _, _ = select.select(socks, [], [], 0.5)
            for s_ in r:
                try: d = s_.recv(65536)
                except Exception: return
                if not d: return
                (up if s_ is c else c).sendall(d)
prx = socketserver.ThreadingTCPServer(("127.0.0.1", PPORT), Proxy); prx.daemon_threads = True
threading.Thread(target=prx.serve_forever, daemon=True).start()
chrome = subprocess.Popen(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", "--window-size=390,844", "--force-device-scale-factor=2",
  "--proxy-server=http://127.0.0.1:%d" % PPORT, "--user-data-dir=" + tempfile.mkdtemp(), "--remote-debugging-port=%d" % CPORT, "about:blank"],
  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: tabs = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json/list" % CPORT)); break
        except Exception: time.sleep(.2)
    ws = [t for t in tabs if t["type"] == "page"][0]["webSocketDebuggerUrl"]
    host, path = ws[len("ws://"):].split("/", 1)
    s = socket.create_connection((host.split(":")[0], int(host.split(":")[1])))
    s.send(("GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (path, host, base64.b64encode(os.urandom(16)).decode())).encode())
    buf = b""
    while b"\r\n\r\n" not in buf: buf += s.recv(4096)
    buf = buf.split(b"\r\n\r\n", 1)[1]
    def send(obj):
        data = json.dumps(obj).encode(); mask = os.urandom(4)
        hdr = bytes([0x81]) + (bytes([0x80 | len(data)]) if len(data) < 126 else bytes([0x80 | 126]) + struct.pack(">H", len(data)))
        s.send(hdr + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))
    def recv_exact(n):
        global buf
        while len(buf) < n: buf += s.recv(65536)
        out, buf = buf[:n], buf[n:]; return out
    def recv():
        msg = b""
        while True:
            h = recv_exact(2); fin = h[0] & 0x80; ln = h[1] & 0x7f
            if ln == 126: ln = struct.unpack(">H", recv_exact(2))[0]
            elif ln == 127: ln = struct.unpack(">Q", recv_exact(8))[0]
            msg += recv_exact(ln)
            if fin: return json.loads(msg)
    n = [0]
    def call(method, params=None):
        n[0] += 1; i = n[0]; send({"id": i, "method": method, "params": params or {}})
        while True:
            m = recv()
            if m.get("id") == i: return m
    def ev(js):
        r = call("Runtime.evaluate", {"expression": js, "awaitPromise": True, "returnByValue": True})
        return r.get("result", {}).get("result", {}).get("value", r)
    base = "http://127.0.0.1:%d/" % PORT
    call("Page.enable"); call("Page.navigate", {"url": base + "index.html#menu"}); time.sleep(2)
    print("online, stored:", ev("""(async()=>{ await navigator.serviceWorker.ready; let last=-1, same=0;
        for (let i=0;i<80;i++){ const k=await caches.keys(); const site=k.find(x=>x.startsWith('trip-site-'));
          const n=site?(await (await caches.open(site)).keys()).length:0; const f=k.includes('trip-fonts')?(await (await caches.open('trip-fonts')).keys()).length:0;
          if (n>=42 && f===last) { if (++same>=4) return {site:n, fontFiles:f}; } else same=0;
          last=f; await new Promise(r=>setTimeout(r,500)); }
        return 'timeout'; })()"""))
    call("Network.enable"); call("Network.clearBrowserCache")   # forget the browser's own cache: fonts must come from the worker's copy
    # airplane mode: no internet, no local server
    OFFLINE[0] = True; srv.shutdown(); srv.server_close()
    call("Page.navigate", {"url": base + "index.html?airplane=1#menu"}); time.sleep(3)
    res = ev("""(async()=>{
      const routes=['menu','days','d1214','d1216','d1219','d1220','d1223','d1228','d1231','food-pwt','food-bali','stay','info','learn','money','pack','home'], out=[];
      const sheet=[...document.styleSheets].find(s=>/fonts.googleapis/.test(s.href||'')); let rules='missing';
      try { rules = sheet ? [...sheet.cssRules].filter(r=>r.type===5).length : 'missing'; } catch(e) { rules='unreadable'; }
      out.push('font stylesheet rules offline: '+rules);
      for (const r of routes){ location.hash=r; await new Promise(x=>setTimeout(x,900)); }
      await document.fonts.ready;
      const faces=[...document.fonts], by={};
      faces.forEach(f=>{ const k=f.family.replace(/"/g,'')+' '+f.weight; by[k]=by[k]||{loaded:0,error:0,unloaded:0}; by[k][f.status==='loaded'?'loaded':f.status==='error'?'error':'unloaded']++; });
      Object.keys(by).sort().forEach(k=>{ if (by[k].loaded||by[k].error) out.push(k+': loaded '+by[k].loaded+', FAILED '+by[k].error); });
      return out; })()""")
    print("airplane mode:"); [print("  " + x) for x in res] if isinstance(res, list) else print(res)
    if SHOT:
        ev("location.hash='d1220'; new Promise(r=>setTimeout(r,1200))")
        shot = call("Page.captureScreenshot", {"format": "png"}); open(SHOT, "wb").write(base64.b64decode(shot["result"]["data"]))
finally:
    chrome.kill()
