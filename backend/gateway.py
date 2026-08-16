"""
dsh-sensevoice 下载网关服务。

职责：
  1. 探测模型与 SenseVoice 服务状态（/health）
  2. 触发模型后台下载并上报进度（/download, /download/status）
  3. 拉起 SenseVoice 推理服务（/start）

前端语音 UI 在模型未就绪时，先请求批准 -> 调 /download -> 轮询 /download/status
显示进度条 -> 下载完成 -> 调 /start 拉起 7101 服务 -> 开始录音转写。

用法: python gateway.py [--port 7102] [--sensevoice-port 7101]
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import threading
import time
import urllib.request

from flask import Flask, jsonify, request
from flask_cors import CORS

# 复用 dsh-sensevoice 的模型路径与下载逻辑
_HERE = os.path.dirname(os.path.abspath(__file__))
_LIB = os.path.abspath(os.path.join(_HERE, "lib"))
_PKG = os.path.dirname(_HERE)
for _p in (_HERE, _LIB, _PKG):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from model_store import _set_progress, get_progress, model_dir, model_ready, reset_progress, uninstall  # noqa: E402
import model_store  # noqa: E402

import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("sensevoice_gateway")

app = Flask(__name__)
CORS(app)

# 实际 SenseVoice 服务地址（前端转写也走这里）
SENSEVOICE_SERVICE = "http://127.0.0.1:7101"

STATE = {
    "downloading": False,
    "service_started_at": None,
    "service_pid": None,
}


def _probe_service() -> dict:
    """探测 SenseVoice 服务是否在运行、模型是否就绪。"""
    try:
        with urllib.request.urlopen(f"{SENSEVOICE_SERVICE}/health", timeout=3) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return {
                "reachable": True,
                "status": resp.status,
                **body,
            }
    except Exception as e:  # noqa: BLE001
        return {
            "reachable": False,
            "error": str(e),
        }


def _start_service() -> dict:
    """拉起 SenseVoice 服务（后台进程）。服务已在运行则直接返回。"""
    # 先探测：服务已就绪就直接返回，避免重复拉起
    probe_now = _probe_service()
    if probe_now.get("reachable") and probe_now.get("model_loaded"):
        return {
            "ok": True,
            "message": "SenseVoice 服务已在运行",
            "pid": STATE.get("service_pid"),
            "health": probe_now,
        }

    if STATE.get("service_pid"):
        try:
            os.kill(STATE["service_pid"], 0)
            # 进程存活但服务不可达（可能仍在加载），等待其就绪
            for _ in range(60):
                probe = _probe_service()
                if probe.get("reachable") and probe.get("model_loaded"):
                    return {"ok": True, "message": "SenseVoice 服务已就绪", "pid": STATE["service_pid"], "health": probe}
                time.sleep(0.5)
        except OSError:
            STATE["service_pid"] = None

    service_py = os.path.join(_PKG, "service.py")
    proc = subprocess.Popen(
        [sys.executable, service_py, "--host", "127.0.0.1", "--port", str(SENSEVOICE_PORT)],
        cwd=_PKG,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    STATE["service_pid"] = proc.pid
    STATE["service_started_at"] = time.time()
    # 等待就绪（最多 60s）
    for _ in range(120):
        probe = _probe_service()
        if probe.get("reachable") and probe.get("model_loaded"):
            return {"ok": True, "message": "SenseVoice 服务已启动", "pid": proc.pid, "health": probe}
        time.sleep(0.5)
    return {"ok": False, "message": "服务启动超时或模型未加载", "pid": proc.pid, "health": probe}


def _run_download():
    try:
        model_store.download_all()
    except Exception as e:  # noqa: BLE001
        logger.error("download failed: %s", e)
    finally:
        STATE["downloading"] = False


@app.route("/health", methods=["GET"])
def health():
    """整体状态：模型是否就绪 + 服务是否在运行。"""
    model_ready_now = model_ready()
    service = _probe_service()
    return jsonify(
        {
            "model_ready": model_ready_now,
            "model_dir": model_dir(),
            "service": service,
            "download": get_progress(),
            "ready": model_ready_now and service.get("reachable") and service.get("model_loaded"),
        }
    )


@app.route("/download", methods=["POST"])
def download():
    """触发模型下载（后台）。前端在用户批准后调用。"""
    if STATE["downloading"]:
        return jsonify({"ok": False, "message": "下载已在进行中", "progress": get_progress()}), 409
    if model_ready():
        # 模型已就绪：把进度置为 ready，前端轮询到 100% 即可结束并转去启动服务
        _set_progress(
            state="ready",
            message="模型已就绪，无需下载",
            progress=100.0,
            finished_at=time.time(),
        )
        return jsonify({"ok": True, "message": "模型已就绪，无需下载", "progress": get_progress()})
    reset_progress()
    STATE["downloading"] = True
    threading.Thread(target=_run_download, daemon=True).start()
    return jsonify({"ok": True, "message": "下载已开始", "progress": get_progress()})


@app.route("/download/status", methods=["GET"])
def download_status():
    return jsonify(get_progress())


@app.route("/start", methods=["POST"])
def start_service():
    """下载完成后拉起 SenseVoice 服务。"""
    if not model_ready():
        return jsonify({"ok": False, "message": "模型未就绪，请先下载"}, 400)
    return jsonify(_start_service())


@app.route("/uninstall", methods=["POST"])
def uninstall_model():
    """卸载模型（删除模型文件），回到待下载状态。"""
    if STATE["downloading"]:
        return jsonify({"ok": False, "message": "下载中，无法卸载"}, 409)
    result = uninstall()
    return jsonify(result)


def _autostart_worker():
    """后台拉起 SenseVoice 服务，不阻塞网关注入监听。"""
    try:
        logger.info("后台拉起 SenseVoice 服务…")
        result = _start_service()
        logger.info("SenseVoice 自动启动: %s", result.get("message"))
    except Exception as e:  # noqa: BLE001
        logger.error("SenseVoice 自动启动失败: %s", e)


def main():
    global SENSEVOICE_PORT
    parser = argparse.ArgumentParser(description="dsh-sensevoice download gateway")
    parser.add_argument("--port", type=int, default=int(os.environ.get("SENSEVOICE_GATEWAY_PORT", "7102")))
    parser.add_argument("--sensevoice-port", type=int, default=int(os.environ.get("SENSEVOICE_PORT", "7101")))
    parser.add_argument("--host", default=os.environ.get("SENSEVOICE_GATEWAY_HOST", "0.0.0.0"))
    parser.add_argument(
        "--autostart",
        action="store_true",
        default=os.environ.get("SENSEVOICE_AUTOSTART", "1") == "1",
        help="启动时若模型就绪则自动拉起 SenseVoice 服务",
    )
    args = parser.parse_args()
    SENSEVOICE_PORT = args.sensevoice_port

    logger.info("=" * 60)
    logger.info("dsh-sensevoice download gateway starting…")
    logger.info("Gateway on   http://%s:%s", args.host, args.port)
    logger.info("SenseVoice   %s", SENSEVOICE_SERVICE)
    logger.info("Model dir    %s (ready=%s)", model_dir(), model_ready())
    logger.info("Autostart    %s", args.autostart)

    # 启动后后台拉起 SenseVoice 服务（模型已下载时），不阻塞网关监听
    if args.autostart and model_ready():
        threading.Thread(target=_autostart_worker, daemon=True).start()

    app.run(host=args.host, port=args.port, debug=False, threaded=True)


if __name__ == "__main__":
    main()