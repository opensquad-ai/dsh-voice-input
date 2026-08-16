/**
 * dsh-voice-input host-side entry.
 *
 * The actual feature is a browser-side client module (see client.js), delivered
 * to the web UI via the package's `dsh.client` declaration. This host entry
 * exists so the bundle is a valid Cordis plugin and the client-module scanner
 * can discover the package's `dsh.client` config.
 */
export const name = 'dsh-voice-input'

export function apply() {
  // no-op host side; UI lives in the browser client bundle
}