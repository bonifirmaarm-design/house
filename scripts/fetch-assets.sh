#!/usr/bin/env bash
# Скачивает все визуалы, сгенерированные в Krea, в assets/img/.
# Запускать локально (в облачной сессии домен app-uploads.krea.ai закрыт egress-политикой).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/img
python3 - <<'PY'
import json, urllib.request, pathlib
m = json.load(open("assets/assets.json"))
for it in m["images"]:
    url = m["base"] + it["id"] + ".png"
    out = pathlib.Path("assets/img") / (it["name"] + ".png")
    if out.exists():
        print("skip", out); continue
    urllib.request.urlretrieve(url, out)
    print("ok  ", out)
PY
