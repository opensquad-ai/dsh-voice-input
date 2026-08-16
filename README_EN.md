# @opensquad/dsh-voice-input

A voice input plugin for [DeepSeek Harness](https://deepseek.com/harness/): adds a microphone button next to the web chat input box. Record, then a local [SenseVoice](https://github.com/FunAudioLLM/SenseVoice) service transcribes it to text and fills the input box automatically. On first use, it guides you through downloading the model with a live progress indicator.

> 简体中文版 / Simplified Chinese: [README.md](./README.md)

## Features

- 🎤 Microphone button next to the input box for one-click record-to-text
- ⬇️ Downloads the model (~230MB) on first use with a circular progress + live percentage on the button
- ⚙ Dedicated management button to view/uninstall the installed voice model
- Automatically starts the local SenseVoice service once the model is ready

## Dependencies

**This is a fully automatic plugin: the Python backend (dependency installation + process startup) is handled automatically by the plugin when dsh starts, and the model is downloaded automatically on first use.** You only need:

| Prerequisite | Description |
| --- | --- |
| **Python 3.10+** | The only soft dependency you must install manually (the plugin auto-installs the rest via `pip install`) |
| **ffmpeg** | Required to transcode browser recordings to WAV: run `winget install ffmpeg` or install from the official site and add to PATH |

### Installing Python 3.10+ manually

> The plugin auto-installs the remaining Python dependencies (flask / onnxruntime, etc.), so you only need Python itself.

1. Open [python.org/downloads](https://www.python.org/downloads/) and download the latest **Python 3.10+** (Windows users: choose `Windows installer (64-bit)`).
2. Run the installer, **make sure to check `Add python.exe to PATH`** at the bottom, then click `Install Now`.
3. After installation, **open a new terminal** (PowerShell / CMD) and verify:
   ```bash
   python --version
   # Expected output similar to: Python 3.12.x (3.10 or higher is fine)
   ```

### Installing ffmpeg manually

> Browser recordings are in WebM format; ffmpeg is required to convert them to WAV before SenseVoice can process them.

- **Option 1 (recommended on Windows)**: run the following in PowerShell
  ```bash
  winget install ffmpeg
  ```
  After installing, **restart your terminal** and verify:
  ```bash
  ffmpeg -version
  ```
- **Option 2 (official site)**: download from [ffmpeg.org/download.html](https://ffmpeg.org/download.html), extract it, and add its `bin` directory to your system PATH.

Done automatically at plugin startup:

1. Detect Python → auto-install dependencies like `flask / onnxruntime / librosa / soundfile / pyyaml` (slow on first run)
2. Auto-start the download gateway (`gateway.py` :7102)
3. On first use → auto-download the model (~230MB) and start the transcription service (`service.py` :7101)

## Installing the Plugin

```bash
dsh plugin --profile web add @opensquad/dsh-voice-input
```

After restarting dsh, the plugin prepares the backend automatically in the background, and a microphone button appears next to the input box.

## Usage

1. Wait a moment after restarting dsh (first run installs Python deps and starts the backend).
2. Click the microphone → confirm the model download on first use → wait for the progress to finish → the service starts automatically.
3. Click again to start recording, click once more to stop and transcribe; the text fills the input box automatically.

When the model is installed, click the ⚙ next to it to uninstall and re-download.

## Compatibility

- Node.js ≥ 22.19.0
- Python 3.10+ (with `python` on PATH)
- DeepSeek Harness (Web profile)
- Browser must support `MediaRecorder` / `getUserMedia`

## License

[MIT](./LICENSE)