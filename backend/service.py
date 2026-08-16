"""SenseVoice-Small INT8 ONNX ASR 服务（自包含版，供 dsh 使用）。

依赖: onnxruntime / soundfile / librosa / numpy / pyyaml / flask / flask-cors
端点:
  GET  /health                      健康检查（dsh 插件会调用）
  POST /v1/audio/transcriptions     OpenAI 兼容转写（dsh 插件调用）
  POST /asr                         原生转写

用法: python service.py [--port 7101] [--host 0.0.0.0]
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

# 让 Flask 服务能 import 同目录的 lib 模块
_HERE = os.path.dirname(os.path.abspath(__file__))
_LIB = os.path.abspath(os.path.join(_HERE, "lib"))
for _p in (_HERE, _LIB):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from inference import SenseVoiceONNX  # noqa: E402
from model_store import model_dir, model_ready  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("sensevoice_service")
logging.getLogger("librosa").setLevel(logging.WARNING)

app = Flask(__name__)
CORS(app)

ENGINE = None
IMPORT_ERROR: str | None = None
STATS = {
    "model_loaded": False,
    "startup_time": time.time(),
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "import_error": None,
}

LANG_MAP = {
    "auto": 0,
    "zh": 3,
    "en": 4,
    "yue": 7,
    "ja": 11,
    "ko": 12,
    "es": 13,
    "fr": 14,
    "de": 15,
    "pt": 16,
}


def _import_engine_class():
    global IMPORT_ERROR, LANG_MAP
    try:
        from inference import LANG_MAP as _LM
        from inference import SenseVoiceONNX

        LANG_MAP = _LM
        IMPORT_ERROR = None
        STATS["import_error"] = None
        return SenseVoiceONNX
    except Exception as e:
        IMPORT_ERROR = str(e)
        STATS["import_error"] = IMPORT_ERROR
        logger.exception("[SenseVoice] Failed to import inference stack: %s", e)
        return None


def load_engine() -> bool:
    global ENGINE
    root = model_dir()
    if not model_ready(root):
        logger.error("[SenseVoice] Model not ready at %s — run download_model.py first", root)
        ENGINE = None
        STATS["model_loaded"] = False
        return False
    cls = _import_engine_class()
    if cls is None:
        ENGINE = None
        STATS["model_loaded"] = False
        return False
    try:
        ENGINE = cls(root)
        STATS["model_loaded"] = True
        logger.info("[SenseVoice] Model loaded from %s", root)
        return True
    except Exception as e:
        logger.exception("[SenseVoice] Failed to load model: %s", e)
        ENGINE = None
        STATS["model_loaded"] = False
        STATS["import_error"] = str(e)
        return False


def convert_to_wav(input_path: str) -> str:
    import shutil

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg not found on PATH. Install ffmpeg to convert browser recordings.")
    wav_path = input_path + "_conv.wav"
    cmd = [
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", input_path,
        "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav_path,
    ]
    proc = subprocess.run(cmd, capture_output=True, timeout=60)
    if proc.returncode != 0 or not os.path.isfile(wav_path) or os.path.getsize(wav_path) < 64:
        err = (proc.stderr or b"").decode(errors="replace")[:400]
        raise RuntimeError(f"ffmpeg convert failed: {err or 'empty output'}")
    return wav_path


def _transcribe_path(wav_or_audio: str, language: str) -> dict:
    global ENGINE
    if ENGINE is None:
        hint = IMPORT_ERROR or "Model not loaded. Run download_model.py then restart the service."
        return {"success": False, "error": hint}
    lang = (language or "auto").strip() or "auto"
    if lang not in LANG_MAP:
        return {"success": False, "error": f"Unsupported language: {lang}"}
    ext = os.path.splitext(wav_or_audio)[1].lower()
    cleanup = None
    work = wav_or_audio
    needs_convert = ext not in (".wav", ".flac")
    if not needs_convert:
        try:
            import soundfile as sf
            sf.info(wav_or_audio)
        except Exception as e:
            logger.info("[SenseVoice] wav/flac probe failed (%s); converting via ffmpeg", e)
            needs_convert = True
    if needs_convert:
        try:
            cleanup = convert_to_wav(wav_or_audio)
            work = cleanup
        except Exception as e:
            return {"success": False, "error": str(e)}
    try:
        import soundfile as sf
        info = sf.info(work)
        duration = float(info.duration)
        t0 = time.time()
        outputs = ENGINE.infer(work, language=lang)
        elapsed = time.time() - t0
        text, detected = ENGINE.decode_ctc(outputs)
        return {
            "success": True,
            "text": text or "",
            "language": detected,
            "duration": round(duration, 2),
            "inference_time": round(elapsed, 3),
        }
    except Exception as e:
        logger.exception("[SenseVoice] infer failed")
        return {"success": False, "error": str(e)}
    finally:
        if cleanup and os.path.isfile(cleanup):
            try:
                os.unlink(cleanup)
            except OSError:
                pass


@app.route("/health", methods=["GET"])
def health():
    ok = bool(STATS["model_loaded"] and ENGINE is not None)
    return jsonify({
        "status": "ok" if ok else "degraded",
        "model_loaded": ok,
        "model": "SenseVoice-Small INT8",
        "ready": model_ready(),
        "import_error": IMPORT_ERROR,
    })


@app.route("/status", methods=["GET"])
def status():
    return jsonify({**STATS, "model_dir": model_dir(), "model_ready": model_ready()})


@app.route("/asr", methods=["POST"])
def asr():
    STATS["total_requests"] += 1
    if ENGINE is None:
        STATS["failed_requests"] += 1
        return jsonify({"success": False, "error": IMPORT_ERROR or "Model not loaded"}), 503
    if "file" not in request.files:
        STATS["failed_requests"] += 1
        return jsonify({"success": False, "error": "No file uploaded"}), 400
    audio_file = request.files["file"]
    language = request.form.get("language") or "auto"
    suffix = Path(audio_file.filename or "audio.webm").suffix or ".webm"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
        result = _transcribe_path(tmp_path, language)
        if not result.get("success"):
            STATS["failed_requests"] += 1
            return jsonify(result), 500
        STATS["successful_requests"] += 1
        return jsonify(result)
    except Exception as e:
        STATS["failed_requests"] += 1
        logger.exception("ASR failed")
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if tmp_path and os.path.isfile(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


@app.route("/v1/audio/transcriptions", methods=["POST"])
def openai_transcriptions():
    STATS["total_requests"] += 1
    if ENGINE is None:
        STATS["failed_requests"] += 1
        return jsonify({
            "success": False,
            "error": IMPORT_ERROR or "SenseVoice model not loaded. Run download_model.py then restart the service.",
        }), 503
    if "file" not in request.files:
        STATS["failed_requests"] += 1
        return jsonify({"success": False, "error": "No audio file; upload using the 'file' field"}), 400
    audio_file = request.files["file"]
    language = request.form.get("language") or "auto"
    if language in ("", "null", "none"):
        language = "auto"
    response_format = (request.form.get("response_format") or "json").strip().lower()
    suffix = Path(audio_file.filename or "audio.wav").suffix or ".wav"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
        result = _transcribe_path(tmp_path, language)
        if not result.get("success"):
            STATS["failed_requests"] += 1
            return jsonify(result), 500
        STATS["successful_requests"] += 1
        text = result.get("text") or ""
        if response_format == "text":
            return text, 200, {"Content-Type": "text/plain; charset=utf-8"}
        return jsonify({
            "text": text,
            "language": result.get("language", "unknown"),
            "duration": result.get("duration"),
            "success": True,
        })
    except Exception as e:
        STATS["failed_requests"] += 1
        logger.exception("OpenAI transcriptions failed")
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if tmp_path and os.path.isfile(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def main():
    parser = argparse.ArgumentParser(description="SenseVoice ASR service for dsh")
    parser.add_argument("--host", default=os.environ.get("SENSEVOICE_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("SENSEVOICE_PORT", "7101")))
    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("SenseVoice-Small ASR service starting…")
    load_engine()
    logger.info("Listening on http://%s:%s", args.host, args.port)
    logger.info("Model dir: %s (ready=%s)", model_dir(), model_ready())
    if IMPORT_ERROR:
        logger.error("Import/runtime error (service stays up degraded): %s", IMPORT_ERROR)
    app.run(host=args.host, port=args.port, debug=False, threaded=True)


if __name__ == "__main__":
    main()