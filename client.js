window.__ModuleLoader__.load({
  id: "@opensquad/dsh-voice-input",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const react = require("react");

    // ── injected styles ─────────────────────────────────────────────
    const VOICE_CSS_ID = "@opensquad/dsh-voice-input/style";
    const VOICE_CSS = `
.dsh-voice-wrap{display:inline-flex;align-items:center;gap:6px;position:relative}
.dsh-voice-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;background:transparent;color:var(--dsw-alias-label-secondary,#666);border-radius:8px;cursor:pointer;font-size:16px;line-height:1;padding:0;transition:background .15s ease,color .15s ease,transform .15s ease;position:relative}
.dsh-voice-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));color:var(--dsw-alias-label-primary,#222)}
.dsh-voice-btn:disabled{opacity:.5;cursor:default}
.dsh-voice-btn-recording{color:#e5484d;animation:dsh-voice-breathe 1.2s ease-in-out infinite}
.dsh-voice-btn-busy{color:var(--dsw-alias-label-tertiary,#999)}
.dsh-voice-manage-btn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:28px;border:none;background:transparent;color:var(--dsw-alias-label-tertiary,#999);border-radius:6px;cursor:pointer;font-size:13px;line-height:1;padding:0;transition:background .15s ease,color .15s ease}
.dsh-voice-manage-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));color:var(--dsw-alias-label-primary,#222)}
.dsh-voice-manage-btn:disabled{opacity:.5;cursor:default}
.dsh-voice-icon{font-size:15px;line-height:1}
.dsh-voice-ring{position:absolute;inset:0;width:28px;height:28px;transform:rotate(-90deg);z-index:1}
.dsh-voice-ring-track{fill:none;stroke:rgba(0,0,0,.12);stroke-width:2.5}
.dsh-voice-ring-bar{fill:none;stroke:var(--dsw-brand,#4b3fe3);stroke-width:2.5;stroke-linecap:round;transition:stroke-dasharray .2s ease}
.dsh-voice-ring-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--dsw-brand,#4b3fe3);z-index:2}
.dsh-voice-dot{width:14px;height:14px;border-radius:50%;background:#e5484d;box-shadow:0 0 0 0 rgba(229,72,77,.5);animation:dsh-voice-pulse 1.2s ease-out infinite}
.dsh-voice-error{position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:#e5484d;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;pointer-events:none}
@keyframes dsh-voice-pulse{0%{box-shadow:0 0 0 0 rgba(229,72,77,.5)}70%{box-shadow:0 0 0 6px rgba(229,72,77,0)}100%{box-shadow:0 0 0 0 rgba(229,72,77,0)}}
@keyframes dsh-voice-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
.dsh-voice-pop{position:absolute;bottom:calc(100% + 8px);right:0;z-index:120;min-width:220px;max-width:280px;background:var(--dsw-specific-menu,var(--ds-c-surface,#fff));border:1px solid var(--dsh-alias-border,var(--ds-c-border,rgba(0,0,0,.12)));border-radius:12px;box-shadow:var(--dsw-shadow-lv3,0 8px 30px rgba(0,0,0,.12));padding:12px;display:flex;flex-direction:column;gap:8px}
.dsh-voice-pop-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,var(--ds-c-text,#222));line-height:18px}
.dsh-voice-pop-desc{font-size:12px;color:var(--dsw-alias-label-tertiary,var(--ds-c-text-muted,#888));line-height:16px}
.dsh-voice-pop-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:2px}
.dsh-voice-pop-btn{font-size:12px;line-height:1;padding:6px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border,var(--ds-c-border,rgba(0,0,0,.12)));background:transparent;color:var(--dsw-alias-label-primary,var(--ds-c-text,#222));cursor:pointer}
.dsh-voice-pop-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}
.dsh-voice-pop-btn-primary{background:var(--dsw-brand,var(--ds-c-brand,#4b3fe3));border-color:var(--dsw-brand,var(--ds-c-brand,#4b3fe3));color:#fff}
.dsh-voice-pop-btn-primary:hover{opacity:.9}
.dsh-voice-pop-btn-danger{color:#e5484d;border-color:rgba(229,72,77,.4)}
.dsh-voice-progress{height:6px;background:var(--dsw-alias-border,var(--ds-c-border,rgba(0,0,0,.1)));border-radius:3px;overflow:hidden}
.dsh-voice-progress-bar{height:100%;background:var(--dsw-brand,var(--ds-c-brand,#4b3fe3));border-radius:3px;transition:width .2s ease}
.dsh-voice-progress-text{font-size:11px;color:var(--dsw-alias-label-tertiary,var(--ds-c-text-muted,#888));text-align:right;line-height:14px}
.dsh-voice-pop-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,var(--ds-c-text-muted,#aaa));line-height:14px}
.dsh-voice-pop-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
`;
    if (typeof document !== "undefined" && !document.querySelector('style[data-plugin-css="' + VOICE_CSS_ID + '"]')) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "@opensquad/dsh-voice-input";
      tag.dataset.pluginCss = VOICE_CSS_ID;
      tag.textContent = VOICE_CSS;
      document.head.appendChild(tag);
    }

    // ── 后端地址 ─────────────────────────────────────────────────
    const GATEWAY_URL = "http://127.0.0.1:7102";            // 下载网关
    const SENSEVOICE_URL = "http://127.0.0.1:7101/v1/audio/transcriptions";  // 转写

    // ── 音频 WAV 转换 ────────────────────────────────────────────
    function writeString(view, offset, text) {
      for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    }

    async function blobToWav(blob) {
      const arrayBuffer = await blob.arrayBuffer();
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("当前浏览器不支持音频解码");
      const audioCtx = new AudioContextClass();
      try {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const numChannels = Math.max(1, audioBuffer.numberOfChannels);
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length * numChannels * 2;
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);
        writeString(view, 0, "RIFF");
        view.setUint32(4, 36 + length, true);
        writeString(view, 8, "WAVE");
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, "data");
        view.setUint32(40, length, true);
        const channels = [];
        for (let ch = 0; ch < numChannels; ch++) channels.push(audioBuffer.getChannelData(ch));
        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
          for (let ch = 0; ch < numChannels; ch++) {
            let sample = Math.max(-1, Math.min(1, channels[ch][i]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            view.setInt16(offset, sample, true);
            offset += 2;
          }
        }
        return new Blob([buffer], { type: "audio/wav" });
      } finally {
        audioCtx.close().catch(() => {});
      }
    }

    async function transcribeBlob(blob) {
      const wavBlob = await blobToWav(blob);
      const form = new FormData();
      form.append("file", wavBlob, "recording.wav");
      form.append("language", "auto");
      const res = await fetch(SENSEVOICE_URL, { method: "POST", body: form, signal: AbortSignal.timeout(30000) });
      const raw = await res.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: raw || ("HTTP " + res.status) }; }
      if (!res.ok || data.success === false) throw new Error(data.error || ("HTTP " + res.status));
      return data.text || "";
    }

    // ── 网关 API ─────────────────────────────────────────────────
    async function gatewayHealth() {
      const res = await fetch(GATEWAY_URL + "/health", { method: "GET", signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error("网关不可用 (" + res.status + ")");
      return await res.json();
    }

    async function gatewayDownload() {
      const res = await fetch(GATEWAY_URL + "/download", { method: "POST", signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!(res.ok || data.ok)) throw new Error(data.message || ("HTTP " + res.status));
      return data;
    }

    async function gatewayStart() {
      const res = await fetch(GATEWAY_URL + "/start", { method: "POST", signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || ("HTTP " + res.status));
      return data;
    }

    async function gatewayUninstall() {
      const res = await fetch(GATEWAY_URL + "/uninstall", { method: "POST", signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || ("HTTP " + res.status));
      return data;
    }

    // ── 主组件 ───────────────────────────────────────────────────
    function VoiceButton(props) {
      const inputActions = props.inputActions;
      const [recording, setRecording] = react.useState(false);
      const [busy, setBusy] = react.useState(false);
      const [error, setError] = react.useState("");
      const [status, setStatus] = react.useState("checking"); // checking | ready | needs-download | downloading | error
      const [downloading, setDownloading] = react.useState(0); // 0-100
      const [downloadMsg, setDownloadMsg] = react.useState("");
      const [pop, setPop] = react.useState(false);             // 下载确认/进度/卸载 弹层
      const mediaRef = react.useRef(null);

      // 首次挂载探测状态
      react.useEffect(() => {
        let cancelled = false;
        (async () => {
          try {
            const h = await gatewayHealth();
            if (cancelled) return;
            if (h.ready) setStatus("ready");
            else if (h.download && h.download.state === "downloading") {
              setStatus("downloading");
              setDownloading(h.download.progress || 0);
              setDownloadMsg(h.download.message || "正在下载模型…");
              setPop(true);
            } else setStatus("needs-download");
          } catch (e) {
            if (cancelled) return;
            setStatus("error");
            setError("语音服务不可用：" + (e && e.message ? e.message : String(e)));
          }
        })();
        return () => { cancelled = true; };
      }, []);

      // 卸载组件时清理麦克风
      react.useEffect(() => {
        return () => {
          if (mediaRef.current && mediaRef.current.stream) {
            mediaRef.current.stream.getTracks().forEach((track) => track.stop());
          }
        };
      }, []);

      // 轮询下载进度
      const pollProgress = react.useCallback(async () => {
        try {
          const res = await fetch(GATEWAY_URL + "/download/status", { method: "GET", signal: AbortSignal.timeout(10000) });
          const d = await res.json();
          setDownloading(d.progress || 0);
          setDownloadMsg(d.message || (d.file ? "正在下载 " + d.file : "正在下载模型…"));
          if (d.state === "ready" || d.progress >= 100) return "done";
          if (d.state === "error") throw new Error(d.error || d.message || "下载失败");
          return "running";
        } catch (e) {
          throw new Error(e && e.message ? e.message : "查询下载进度失败");
        }
      }, []);

      // 确认下载
      const confirmDownload = react.useCallback(async () => {
        setBusy(true);
        setError("");
        try {
          await gatewayDownload();
          setStatus("downloading");
          setDownloading(0);
          setDownloadMsg("开始下载…");
          for (;;) {
            await new Promise((r) => setTimeout(r, 1000));
            const state = await pollProgress();
            if (state === "done") break;
          }
          setDownloadMsg("模型下载完成，正在启动服务…");
          // 非阻塞拉起服务，随后轮询 /health 直到就绪（网关刷新进度，避免假死）
          await gatewayStart();
          const START_TIMEOUT = 180; // 秒
          let waited = 0;
          for (;;) {
            await new Promise((r) => setTimeout(r, 1500));
            waited += 1.5;
            let ready = false;
            try {
              const h = await gatewayHealth();
              ready = !!h.ready;
            } catch (e) { /* 服务尚未可连通，继续等待 */ }
            if (ready) break;
            setDownloadMsg(`模型下载完成，正在启动服务…（${Math.floor(waited)}s）`);
            if (waited >= START_TIMEOUT) throw new Error("服务启动超时，请查看后端日志");
          }
          setStatus("ready");
          setPop(false);
          setDownloadMsg("");
        } catch (e) {
          setStatus("error");
          setError("下载或启动失败：" + (e && e.message ? e.message : String(e)));
          setPop(true);
        } finally {
          setBusy(false);
        }
      }, [pollProgress]);

      // 卸载模型
      const confirmUninstall = react.useCallback(async () => {
        setBusy(true);
        setError("");
        try {
          await gatewayUninstall();
          setStatus("needs-download");
          setDownloading(0);
          setDownloadMsg("");
          setPop(false);
        } catch (e) {
          setError("卸载失败：" + (e && e.message ? e.message : String(e)));
        } finally {
          setBusy(false);
        }
      }, []);

      // 录音主逻辑
      const toggle = react.useCallback(async () => {
        if (busy) return;
        setError("");

        if (status === "needs-download" || status === "error") {
          try {
            const h = await gatewayHealth();
            if (h.ready) { setStatus("ready"); return; }
          } catch (_) { /* ignore */ }
          setPop((p) => !p);
          return;
        }
        // 下载中：点击按钮切换弹窗开关（可再次点击收起）
        if (status === "downloading") {
          setPop((p) => !p);
          return;
        }

        if (recording) {
          const media = mediaRef.current;
          if (media && media.recorder && media.recorder.state !== "inactive") media.recorder.stop();
          return;
        }

        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("当前浏览器不支持麦克风录音");
          }
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mimeType = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm" : "";
          const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          const chunks = [];
          recorder.ondataavailable = (event) => { if (event.data && event.data.size > 0) chunks.push(event.data); };
          recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
            setRecording(false);
            setBusy(true);
            try {
              const text = await transcribeBlob(blob);
              if (text && text.trim()) inputActions.setDraft(text.trim());
              else setError("未识别到语音，请重试");
            } catch (err) {
              setError("语音转文字失败：" + (err && err.message ? err.message : String(err)));
            } finally {
              setBusy(false);
              stream.getTracks().forEach((track) => track.stop());
            }
          };
          mediaRef.current = { recorder, chunks, stream };
          recorder.start();
          setRecording(true);
        } catch (err) {
          setError("无法开始录音：" + (err && err.message ? err.message : String(err)));
        }
      }, [recording, busy, status, inputActions]);

      // 按钮图标
      const RING_R = 11.5;
      const RING_C = 2 * Math.PI * RING_R;
      let icon;
      if (recording) icon = react.createElement("span", { className: "dsh-voice-dot" });
      else if (status === "downloading") icon = [
        react.createElement("span", { key: "i", className: "dsh-voice-icon" }, "⏳"),
        react.createElement(
          "svg",
          { key: "r", className: "dsh-voice-ring", viewBox: "0 0 28 28" },
          react.createElement("circle", { cx: 14, cy: 14, r: RING_R, className: "dsh-voice-ring-track" }),
          react.createElement("circle", {
            cx: 14, cy: 14, r: RING_R,
            className: "dsh-voice-ring-bar",
            strokeDasharray: (downloading / 100) * RING_C + " " + RING_C,
          })
        ),
        react.createElement("span", { key: "l", className: "dsh-voice-ring-label" }, Math.floor(downloading) + "%"),
      ];
      else if (status === "needs-download") icon = react.createElement("span", { className: "dsh-voice-icon" }, "⬇️");
      else icon = react.createElement("span", { className: "dsh-voice-icon" }, "🎤");

      const btnClass = "dsh-voice-btn"
        + (recording ? " dsh-voice-btn-recording" : "")
        + (busy ? " dsh-voice-btn-busy" : "")
        + (status === "downloading" ? " dsh-voice-btn-busy" : "");

      let title;
      if (recording) title = "点击停止录音并转文字";
      else if (status === "downloading") title = "正在下载语音模型…";
      else if (status === "needs-download") title = "语音模型未安装，点击下载";
      else title = "点击开始语音输入";

      return react.createElement(
        "div",
        { className: "dsh-voice-wrap" },
        error
          ? react.createElement("div", { className: "dsh-voice-error", title: error }, "!")
          : null,
        react.createElement(
          "button",
          {
            type: "button",
            className: btnClass,
            onClick: toggle,
            disabled: busy || status === "downloading",
            title: title,
            "aria-label": title,
          },
          icon
        ),
        // 模型就绪时显示独立"管理"按钮，用于打开包含卸载入口的面板
        status === "ready" && !recording
          ? react.createElement(
              "button",
              {
                type: "button",
                className: "dsh-voice-manage-btn",
                onClick: () => setPop((p) => !p),
                disabled: busy,
                title: "管理语音模型",
                "aria-label": "管理语音模型",
              },
              "⚙"
            )
          : null,
        pop && !recording
          ? react.createElement(
              "div",
              { className: "dsh-voice-pop", "data-composer-card": true },
              status === "downloading"
                ? [
                    react.createElement("div", { key: "t", className: "dsh-voice-pop-title" }, "正在下载语音模型"),
                    react.createElement("div", { key: "p", className: "dsh-voice-progress" },
                      react.createElement("div", { className: "dsh-voice-progress-bar", style: { width: Math.min(100, downloading) + "%" } })
                    ),
                    react.createElement("div", { key: "pt", className: "dsh-voice-progress-text" }, Math.floor(downloading) + "%"),
                    react.createElement("div", { key: "m", className: "dsh-voice-pop-desc" }, downloadMsg || "…"),
                  ]
                : status === "needs-download"
                ? [
                    react.createElement("div", { key: "t", className: "dsh-voice-pop-title" }, "需要下载语音识别模型"),
                    react.createElement("div", { key: "d", className: "dsh-voice-pop-desc" },
                      "首次使用需要下载约 230MB 的 SenseVoice 模型，下载完成后自动启动服务。"),
                    react.createElement("div", { key: "a", className: "dsh-voice-pop-actions" },
                      react.createElement("button", { type: "button", className: "dsh-voice-pop-btn", onClick: () => setPop(false) }, "取消"),
                      react.createElement("button", { type: "button", className: "dsh-voice-pop-btn dsh-voice-pop-btn-primary", onClick: confirmDownload, disabled: busy }, busy ? "准备中…" : "确认下载")
                    ),
                  ]
                : status === "error"
                ? [
                    react.createElement("div", { key: "t", className: "dsh-voice-pop-title" }, "语音服务不可用"),
                    react.createElement("div", { key: "d", className: "dsh-voice-pop-desc" }, error || "请检查语音服务"),
                    react.createElement("div", { key: "a", className: "dsh-voice-pop-actions" },
                      react.createElement("button", { type: "button", className: "dsh-voice-pop-btn", onClick: () => setPop(false) }, "关闭"),
                      react.createElement("button", { type: "button", className: "dsh-voice-pop-btn dsh-voice-pop-btn-primary", onClick: () => { setError(""); setPop(false); toggle(); } }, "重试")
                    ),
                  ]
                : [
                    react.createElement("div", { key: "t", className: "dsh-voice-pop-title" }, "语音模型已就绪"),
                    react.createElement("div", { key: "d", className: "dsh-voice-pop-row" },
                      react.createElement("span", { className: "dsh-voice-pop-desc" }, "模型已安装"),
                      react.createElement("button", { type: "button", className: "dsh-voice-pop-btn dsh-voice-pop-btn-danger", onClick: confirmUninstall, disabled: busy }, "卸载")
                    ),
                  ]
            )
          : null
      );
    }

    function apply(ctx) {
      ctx.inject(["slots"], (scope) => {
        scope.slots.inject("conversation.input.right", () => scope.slots.register({
          name: "conversation.input.right",
          id: "voice-input",
          order: 10,
        }, VoiceButton));
      });
    }

    exports.name = "dsh-voice-input";
    exports.inject = ["slots"];
    exports.apply = apply;

    return module.exports;
  },
});