"""SenseVoice 模型下载（自包含，摘自 OpenSquad sensevoice/model_store.py）。

负责把 4 个必需文件下载到 model/ 目录：
  model_quant.onnx  <- sherpa-onnx (HF 镜像)
  tokens.json       <- ModelScope iic/SenseVoiceSmall
  am.mvn            <- ModelScope iic/SenseVoiceSmall
  config.yaml       <- ModelScope iic/SenseVoiceSmall
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request

# 全局下载进度（线程安全），供下载网关 /download/status 查询
_progress_lock = threading.Lock()
_progress = {
    "state": "idle",  # idle | downloading | ready | error
    "message": "",
    "file": "",
    "progress": 0.0,   # 0-100
    "bytes_done": 0,
    "bytes_total": 0,
    "started_at": None,
    "finished_at": None,
    "error": "",
}


def reset_progress():
    with _progress_lock:
        _progress.update(
            {
                "state": "idle",
                "message": "",
                "file": "",
                "progress": 0.0,
                "bytes_done": 0,
                "bytes_total": 0,
                "started_at": None,
                "finished_at": None,
                "error": "",
            }
        )


def uninstall() -> dict:
    """删除模型文件，回到未下载状态。恢复下载进度为 idle。"""
    root = model_dir()
    removed = []
    for name in (*REQUIRED_FILES, *OPTIONAL_FILES):
        p = os.path.join(root, name)
        try:
            if os.path.isfile(p):
                os.remove(p)
                removed.append(name)
        except OSError:
            pass
    reset_progress()
    return {
        "ok": True,
        "removed": removed,
        **get_status(),
    }


def get_progress() -> dict:
    with _progress_lock:
        return dict(_progress)


def _set_progress(**kw):
    with _progress_lock:
        _progress.update(kw)

REQUIRED_FILES = ("model_quant.onnx", "tokens.json", "am.mvn", "config.yaml")
OPTIONAL_FILES = ("configuration.json",)

MODELSCOPE_BASE = "https://www.modelscope.cn/models/iic/SenseVoiceSmall/resolve/master"

# 官方 repo 不提供量化 ONNX，权重来自 sherpa-onnx 的 HF 镜像
SHERPA_ONNX_REPO = "csukuangfj/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17"
SHERPA_ONNX_FILENAME = "model.int8.onnx"
SHERPA_ONNX_MIRRORS = (
    os.environ.get("SENSEVOICE_ONNX_MIRROR", "https://hf-mirror.com"),
    "https://huggingface.co",
)

# 兜底：当服务器不返回 Content-Length 时，用已知的预期大小估算进度，
# 避免 230MB 的模型下载全程卡在 0%。实际以 HEAD 请求为准。
EXPECTED_SIZES = {
    "model_quant.onnx": 232 * 1024 * 1024,  # ~232MB
    "tokens.json": 8 * 1024 * 1024,         # ~8MB
    "am.mvn": 2 * 1024 * 1024,              # ~2MB
    "config.yaml": 64 * 1024,               # ~64KB
    "configuration.json": 16 * 1024,
}


def _remote_size(url: str) -> int:
    """HEAD 请求获取远端文件大小；失败返回 0。"""
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "dsh-sensevoice/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return int(resp.headers.get("Content-Length") or 0)
    except Exception:  # noqa: BLE001
        return 0


def model_dir() -> str:
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "model")


def model_ready(directory: str | None = None) -> bool:
    root = directory or model_dir()
    return all(os.path.isfile(os.path.join(root, name)) for name in REQUIRED_FILES)


def model_file_sizes(directory: str | None = None) -> dict[str, int]:
    root = directory or model_dir()
    out: dict[str, int] = {}
    for name in (*REQUIRED_FILES, *OPTIONAL_FILES):
        p = os.path.join(root, name)
        if os.path.isfile(p):
            try:
                out[name] = os.path.getsize(p)
            except OSError:
                out[name] = 0
    return out


def get_status() -> dict:
    ready = model_ready()
    return {
        "ready": ready,
        "model_dir": model_dir(),
        "files": model_file_sizes(),
        "required_files": list(REQUIRED_FILES),
        "missing": [n for n in REQUIRED_FILES if not os.path.isfile(os.path.join(model_dir(), n))],
    }


def _download_one(url: str, dest: str, file_index: int, total_files: int) -> None:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "dsh-sensevoice/1.0"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        total = int(resp.headers.get("Content-Length") or 0)
        # Content-Length 缺失时先 HEAD 探测，再退回预期大小，保证进度可算
        if total <= 0:
            total = _remote_size(url) or EXPECTED_SIZES.get(os.path.basename(dest), 0)
        done = 0
        chunk = 1024 * 256
        with open(dest + ".part", "wb") as out:
            while True:
                buf = resp.read(chunk)
                if not buf:
                    break
                out.write(buf)
                done += len(buf)
                # 整体进度 = 已完成的文件数 + 当前文件的占比
                frac = (done / total) if total else 0.0
                overall = (file_index + frac) / max(total_files, 1) * 100.0
                _set_progress(
                    file=os.path.basename(dest),
                    progress=round(min(overall, 99.9), 1),
                    bytes_done=done,
                    bytes_total=total,
                )
    os.replace(dest + ".part", dest)


def _download_file(root: str, name: str, file_index: int, total_files: int) -> None:
    dest = os.path.join(root, name)
    if os.path.isfile(dest) and os.path.getsize(dest) > 0:
        print(f"  [skip] {name} 已存在")
        return
    if name == "model_quant.onnx":
        urls = [f"{ep.rstrip('/')}/{SHERPA_ONNX_REPO}/resolve/main/{SHERPA_ONNX_FILENAME}" for ep in SHERPA_ONNX_MIRRORS]
        labels = [ep.replace("https://", "") for ep in SHERPA_ONNX_MIRRORS]
    else:
        urls = [f"{MODELSCOPE_BASE}/{name}"]
        labels = ["modelscope.cn"]
    last: Exception | None = None
    for url, label in zip(urls, labels, strict=False):
        try:
            print(f"  [download] {name}  <- {label}")
            _download_one(url, dest, file_index, total_files)
            return
        except Exception as e:  # noqa: BLE001
            last = e
            print(f"  [warn] mirror {label} failed for {name}: {e}")
    if last is not None:
        raise last
    raise RuntimeError(f"no mirror produced {name}")


def download_all() -> dict:
    root = model_dir()
    os.makedirs(root, exist_ok=True)
    files = list(REQUIRED_FILES) + [f for f in OPTIONAL_FILES if f not in REQUIRED_FILES]
    _set_progress(
        state="downloading",
        message="开始下载 SenseVoice 模型",
        progress=0.0,
        started_at=time.time(),
        finished_at=None,
        error="",
    )
    try:
        for i, name in enumerate(files):
            _download_file(root, name, i, len(files))
        if not model_ready(root):
            missing = [n for n in REQUIRED_FILES if not os.path.isfile(os.path.join(root, n))]
            _set_progress(
                state="error",
                message=f"下载不完整，缺少: {', '.join(missing)}",
                progress=0.0,
                finished_at=time.time(),
            )
            return {**get_status(), "ok": False, "message": f"下载不完整，缺少: {', '.join(missing)}"}
        _set_progress(
            state="ready",
            message="模型下载完成",
            progress=100.0,
            finished_at=time.time(),
        )
        return {**get_status(), "ok": True, "message": "模型下载完成"}
    except Exception as e:  # noqa: BLE001
        _set_progress(
            state="error",
            message=str(e),
            progress=-1.0,
            finished_at=time.time(),
            error=str(e),
        )
        raise


if __name__ == "__main__":
    result = download_all()
    print(json.dumps(result, ensure_ascii=False, indent=2))