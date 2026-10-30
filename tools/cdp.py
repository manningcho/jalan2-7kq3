# Minimal Chrome DevTools Protocol client (no third-party libs).
# usage: python3 cdp.py <url> <cpu-throttle> <wait-before-ms> <js-file>  -> prints JSON result of the evaluated promise
import base64, json, os, socket, struct, subprocess, sys, tempfile, time, urllib.request
url, rate, wait, jsfile = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
port = 9333 + os.getpid() % 500
chrome = subprocess.Popen(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", "--window-size=" + os.environ.get("WIN", "390,844"),
  "--force-device-scale-factor=3", "--user-data-dir=" + tempfile.mkdtemp(), "--remote-debugging-port=%d" % port, "about:blank"],
  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try:
            tabs = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json/list" % port)); break
        except Exception: time.sleep(.2)
    ws = [t for t in tabs if t["type"] == "page"][0]["webSocketDebuggerUrl"]
    host, path = ws[len("ws://"):].split("/", 1)
    s = socket.create_connection((host.split(":")[0], int(host.split(":")[1])))
    key = base64.b64encode(os.urandom(16)).decode()
    s.send(("GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (path, host, key)).encode())
    buf = b""
    while b"\r\n\r\n" not in buf: buf += s.recv(4096)
    buf = buf.split(b"\r\n\r\n", 1)[1]
    def send(obj):
        data = json.dumps(obj).encode(); mask = os.urandom(4)
        hdr = bytes([0x81]) + (bytes([0x80 | len(data)]) if len(data) < 126 else bytes([0x80 | 126]) + struct.pack(">H", len(data)) if len(data) < 65536 else bytes([0x80 | 127]) + struct.pack(">Q", len(data)))
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
    call("Page.enable"); call("Emulation.setCPUThrottlingRate", {"rate": rate})
    # 新版無頭 Chrome 視窗最窄只有 500px，WIN 的寬度要另外用模擬手機螢幕的方式設定才準
    ww, wh = [int(x) for x in os.environ.get("WIN", "390,844").split(",")]
    call("Emulation.setDeviceMetricsOverride", {"width": ww, "height": wh, "deviceScaleFactor": 3, "mobile": True})
    if os.environ.get("NET"):
        down, lat = [float(x) for x in os.environ["NET"].split(",")]
        call("Network.enable"); call("Network.emulateNetworkConditions", {"offline": False, "latency": lat, "downloadThroughput": down * 1024 * 1024 / 8, "uploadThroughput": 750 * 1024 / 8})
    call("Page.navigate", {"url": url})
    time.sleep(wait / 1000.0)
    r = call("Runtime.evaluate", {"expression": open(jsfile).read(), "awaitPromise": True, "returnByValue": True})
    print(json.dumps(r.get("result", {}).get("result", {}).get("value", r)))
    if len(sys.argv) > 5:
        shot = call("Page.captureScreenshot", {"format": "png"})
        open(sys.argv[5], "wb").write(base64.b64decode(shot["result"]["data"]))
finally:
    chrome.kill()
