/**
 * dsh-voice-input host-side entry.
 *
 * 职责：
 *  1. 暴露标准 Cordis 插件入口（name/apply），供 dsh 作为 bundle 挂载。
 *  2. 自动管理本地 Python 后端（SenseVoice 网关）：
 *       - 探测 Python 是否可用
 *       - 确保 Python 依赖已安装（缺失则自动 pip install）
 *       - 确保 7102 网关进程在运行（未运行则后台拉起，不阻塞 dsh 启动）
 *
 * 前端 UI（浏览器端）见 client.js，经 package.json 的 `dsh.client` 声明下发。
 * 模型（约 230MB）不在打包内，首次使用时由网关自动下载，前端 UI 显示进度。
 */
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { spawn, execFile } from 'node:child_process'
import net from 'node:net'

export const name = 'dsh-voice-input'

const HERE = dirname(fileURLToPath(import.meta.url))
const BACKEND = join(HERE, 'backend')
const GATEWAY_PORT = 7102
const SENSEVOICE_PORT = 7101

/** 探测 127.0.0.1:port 是否已被监听 */
function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port })
    sock.setTimeout(800)
    sock.once('connect', () => { sock.destroy(); resolve(true) })
    sock.once('error', () => resolve(false))
    sock.once('timeout', () => { sock.destroy(); resolve(false) })
  })
}

/** 执行命令，收集结果（不抛异常） */
function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: opts.timeout || 120000, windowsHide: true }, (err, stdout, stderr) => {
      resolve({ ok: !err, code: err ? err.code : 0, stdout: stdout || '', stderr: stderr || '' })
    })
  })
}

/** 找到可用的 python 解释器 */
async function findPython() {
  for (const py of ['python', 'py']) {
    const r = await run(py, ['-c', 'import sys; print(sys.executable)'])
    if (r.ok) {
      const exe = r.stdout.trim().split('\n')[0]
      if (exe && exe.toLowerCase().endsWith('.exe')) return { cmd: py, exe }
      if (exe) return { cmd: py, exe }
    }
  }
  return null
}

/** 确保 Python 依赖已安装（缺失则自动安装） */
async function ensureDeps(py) {
  const check = await run(py.cmd, ['-c', 'import flask, flask_cors, onnxruntime, soundfile, librosa, numpy, yaml'])
  if (check.ok) return { installed: true }
  console.warn('[dsh-voice-input] Python 依赖缺失，自动安装（首次较慢，需几分钟）…')
  const req = join(BACKEND, 'requirements.txt')
  const r = await run(py.cmd, ['-m', 'pip', 'install', '-r', req], { timeout: 600000 })
  if (!r.ok) {
    console.warn('[dsh-voice-input] Python 依赖安装失败: ' + (r.stderr.trim() || r.stdout.trim()).slice(0, 500))
    return { installed: false, error: r.stderr || r.stdout }
  }
  return { installed: true }
}

/** 确保 7102 网关在运行；未运行则后台拉起 */
async function ensureGateway(py) {
  if (await isPortOpen(GATEWAY_PORT)) return { running: true }
  const proc = spawn(
    py.cmd,
    [join(BACKEND, 'gateway.py'), '--port', String(GATEWAY_PORT), '--sensevoice-port', String(SENSEVOICE_PORT)],
    { cwd: BACKEND, detached: true, stdio: 'ignore', windowsHide: true }
  )
  proc.unref()
  // 等待网关就绪（最多 12s）
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await isPortOpen(GATEWAY_PORT)) return { running: true, pid: proc.pid }
  }
  return { running: false }
}

export function apply() {
  // 后台执行，不阻塞 dsh 启动
  ;(async () => {
    try {
      const py = await findPython()
      if (!py) {
        console.warn('[dsh-voice-input] 未找到 Python，请先安装 Python 3.10+（后端无法自动启动）')
        return
      }
      const deps = await ensureDeps(py)
      if (!deps.installed) return
      const gw = await ensureGateway(py)
      console.log('[dsh-voice-input] 后端网关 ' + (gw.running ? '已就绪 (:7102)' : '启动失败'))
    } catch (e) {
      console.warn('[dsh-voice-input] 后端自动启动出错: ' + (e && e.message ? e.message : String(e)))
    }
  })()
}