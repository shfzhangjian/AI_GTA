#!/usr/bin/env python3
"""Acquire the official character for local game use; see THIRD_PARTY_ASSETS.md."""
from pathlib import Path
from urllib.request import urlopen
import hashlib

SOURCE = "https://threejs.org/examples/models/gltf/Soldier.glb"
EXPECTED_SHA256 = "dfb230fc1f942f259dd00281a1186953ad602fc5d69067ce63e24b2aa439736b"
TARGET = Path(__file__).resolve().parent / "dist" / "assets" / "vanguard.glb"

if TARGET.exists() and hashlib.sha256(TARGET.read_bytes()).hexdigest() == EXPECTED_SHA256:
    print("Character is already installed and verified.")
else:
    print("Downloading the official Three.js/Mixamo character for this game.")
    print("Usage terms: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html")
    with urlopen(SOURCE, timeout=45) as response:
        data = response.read(8 * 1024 * 1024 + 1)
    if hashlib.sha256(data).hexdigest() != EXPECTED_SHA256:
        raise SystemExit("The official asset has changed; no file was written. Review the source before updating the expected hash.")
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_bytes(data)
    print("Character installed. Start the local server as described in README.md.")
