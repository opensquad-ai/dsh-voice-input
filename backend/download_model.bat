@echo off
REM ============================================================
REM  SenseVoice 模型一键下载脚本 (dsh-sensevoice)
REM  下载 4 个模型文件到 model\ 目录，约 230MB
REM ============================================================
cd /d "%~dp0"
echo.
echo  [1/2] 下载 SenseVoice-Small INT8 ONNX 模型 (约 230MB)...
echo        model_quant.onnx  <- sherpa-onnx (HF 镜像)
echo        tokens.json / am.mvn / config.yaml  <- ModelScope
echo.
python lib\model_store.py
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] 下载失败，请检查网络后重试。
    pause
    exit /b 1
)
echo.
echo  [2/2] 下载完成。模型已就绪，可运行 start_service.bat 启动服务。
echo.
pause