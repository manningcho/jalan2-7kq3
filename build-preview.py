# 產生單一檔案版本（給 claude.ai 預覽用）。GitHub 上用 index.html 就好，不需要跑這個。
import pathlib
d = pathlib.Path(__file__).parent
out = (d / "head.html").read_text("utf8")
out += "<style>\n" + (d / "style.css").read_text("utf8") + "\n</style>\n"
out += '<div id="app"></div>\n'
out += "<script>\n" + (d / "data.js").read_text("utf8") + "\n</script>\n"
out += "<script>\n" + (d / "lq.js").read_text("utf8") + "\n</script>\n"
out += "<script>\n" + (d / "art.js").read_text("utf8") + "\n</script>\n"
out += "<script>\n" + (d / "app.js").read_text("utf8") + "\n</script>\n"
(d / "dist").mkdir(exist_ok=True)
(d / "dist" / "preview.html").write_text(out, "utf8")
print("dist/preview.html", len(out))
