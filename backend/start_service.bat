@echo off
REM ============================================================
REM  SenseVoice ASR 服务启动脚本 (dsh-sensevoice)
REM  默认监听 127.0.0.1:7101，与 dsh 的 sensevoice-asr 插件对接
REM ============================================================
cd /d "%~dp0"
echo.
echo  [检查] 模型是否已下载...
python -c "import sys; sys.path.insert(0,'lib'); from model_store import model_ready; print('model_ready =', model_ready())"
if not exist "model\model_quant.onnx" (
    echo.
    echo  [提示] 模型未下载，请先运行 download_model.bat 下载模型。
    pause
    exit /b 1
)
echo.
echo  [启动] SenseVoice ASR 服务 -> http://127.0.0.1:7101
echo         按 Ctrl+C 停止服务
echo.
python service.py --host 127.0.0.1 --port 7101
pause