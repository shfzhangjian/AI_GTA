"""Start SUNFALL on Windows and open its local URL."""
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError, URLError
import hashlib
import subprocess
import sys
import time
import webbrowser

ROOT = Path(__file__).resolve().parent
URL = "http://127.0.0.1:4177/"
CHARACTER = ROOT / "dist" / "assets" / "vanguard.glb"
EXPECTED = "dfb230fc1f942f259dd00281a1186953ad602fc5d69067ce63e24b2aa439736b"


def server_ready():
    try:
        with urlopen(URL, timeout=2) as response:
            content = response.read(4096)
        if "落日协议 · SUNFALL".encode() not in content:
            raise RuntimeError("Port 4177 is occupied by another application.")
        return True
    except HTTPError as exc:
        raise RuntimeError("Port 4177 is occupied by another application.") from exc
    except (URLError, TimeoutError, ConnectionError):
        return False


def main():
    if not CHARACTER.exists() or hashlib.sha256(CHARACTER.read_bytes()).hexdigest() != EXPECTED:
        subprocess.run([sys.executable, str(ROOT / "setup_character.py")], cwd=ROOT, check=True)
    if not server_ready():
        with (ROOT / "server.stdout.log").open("ab") as out, (ROOT / "server.stderr.log").open("ab") as err:
            process = subprocess.Popen(
                [sys.executable, "-u", "-m", "http.server", "4177", "--bind", "127.0.0.1", "--directory", str(ROOT / "dist")],
                cwd=ROOT,
                stdin=subprocess.DEVNULL,
                stdout=out,
                stderr=err,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        (ROOT / "server.pid").write_text(str(process.pid), encoding="ascii")
        for _ in range(30):
            if server_ready():
                break
            if process.poll() is not None:
                raise RuntimeError("Server failed to start. See server.stderr.log.")
            time.sleep(0.2)
        else:
            process.terminate()
            raise RuntimeError("Server did not become ready. See server.stderr.log.")
    print("SUNFALL is running: " + URL)
    if "--no-browser" not in sys.argv:
        webbrowser.open(URL)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("SUNFALL could not start: " + str(exc), file=sys.stderr)
        sys.exit(1)
