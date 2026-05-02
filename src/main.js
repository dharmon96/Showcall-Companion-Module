/**
 * companion-module-darianharmon-showcall
 *
 * Bitfocus Companion module for ShowCall — control live shows from a
 * Stream Deck. Connects to a ShowCall server via a showcaller-level share
 * token, polls the state endpoint to hydrate, and listens to Socket.IO
 * for real-time updates.
 */

import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base'

import { ShowCallApi } from './api.js'
import { defineActions } from './actions.js'
import { defineVariables, buildVariableValues } from './variables.js'
import { defineFeedbacks } from './feedbacks.js'
import { definePresets } from './presets.js'

class ShowCallInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Latest state snapshot — actions, feedbacks, and the variable refresher
		// all read from here. We update it on every state-changed event.
		this.state = {
			show: null,
			activeCue: null,
			nextCue: null,
			cuesTotal: 0,
			cuesCompleted: 0,
			cuePosition: 0,
			isLive: false,
			connected: false,
			broadcastActive: false,
			broadcastText: '',
			broadcastColor: '',
		}

		this.api = null
		this.tickInterval = null
		this.pollInterval = null
		// Self-clears the module's broadcast state when a timed/screen-flash
		// banner reaches its expected end. The web banner does the same thing
		// locally, but no `broadcast:clear` is ever emitted, so the module's
		// match-feedback would otherwise stay lit forever.
		this.broadcastClearTimer = null
	}

	// How long the module pretends a 'screen-flash' broadcast lives so its
	// match-feedback drops at the same moment the on-screen banner naturally
	// fades. Mirrors SCREEN_FLASH_BANNER_LIFETIME_MS in BroadcastBanner.tsx.
	static SCREEN_FLASH_LIFETIME_MS = 4000

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'help',
				label: 'How to connect',
				width: 12,
				value:
					'In ShowCall, open <b>Tools → Companion / Stream Deck</b>, create a Companion link, and copy the <b>Connection URL</b>. ' +
					'Paste it below — that\'s the only field you need.',
			},
			{
				type: 'textinput',
				id: 'connectionUrl',
				label: 'Connection URL (paste from ShowCall)',
				width: 12,
				default: '',
				tooltip: 'Format: https://your-server.example.com?token=<companion-token>',
			},
		]
	}

	/**
	 * Parse the single Connection URL into a server origin + token. Accepts:
	 *  1. A standard URL with `?token=<x>` query param  (preferred)
	 *  2. A legacy "<url>|<token>" pipe-delimited string (for tokens minted
	 *     by older ShowCall builds)
	 *  3. A plain UUID, in which case we fall back to the default server URL
	 *
	 * Returns { serverUrl, token } or { serverUrl: '', token: '' } if unparseable.
	 */
	_parseConnection(input) {
		const raw = (input || '').trim()
		if (!raw) return { serverUrl: '', token: '' }

		// Legacy pipe format
		if (raw.includes('|') && !raw.startsWith('http')) {
			const idx = raw.indexOf('|')
			return { serverUrl: raw.slice(0, idx).trim(), token: raw.slice(idx + 1).trim() }
		}
		if (raw.includes('|') && raw.startsWith('http')) {
			const idx = raw.indexOf('|')
			return { serverUrl: raw.slice(0, idx).trim(), token: raw.slice(idx + 1).trim() }
		}

		// URL with ?token= query
		try {
			const u = new URL(raw)
			const token = u.searchParams.get('token') || ''
			if (token) return { serverUrl: u.origin, token }
			// URL without a token query — treat the URL as just the server,
			// no token. Caller will see empty token and refuse to connect.
			return { serverUrl: u.origin, token: '' }
		} catch {
			// Not a URL — assume it's a bare token. Default server URL is
			// the canonical hosted ShowCall instance.
			return { serverUrl: 'https://show.mantaglow.com', token: raw }
		}
	}

	async init(config) {
		this.config = config || {}
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.setPresetDefinitions(definePresets())
		await this._connect()
	}

	async configUpdated(config) {
		this.config = config || {}
		await this._reconnect()
	}

	async destroy() {
		this._teardown()
	}

	updateActions() {
		this.setActionDefinitions(defineActions(this))
	}

	updateFeedbacks() {
		this.setFeedbackDefinitions(defineFeedbacks(this))
	}

	updateVariableDefinitions() {
		this.setVariableDefinitions(defineVariables())
	}

	// ── connection lifecycle ────────────────────────────────────────────

	async _connect() {
		const { serverUrl, token } = this._parseConnection(this.config.connectionUrl)
		if (!serverUrl || !token) {
			this.updateStatus(InstanceStatus.BadConfig, 'Paste a Connection URL from ShowCall → Tools → Companion')
			return
		}

		this.api = new ShowCallApi(serverUrl, token, (level, msg) => this.log(level, msg))

		// Hydrate state via REST first so feedbacks have something to read even
		// before the socket is up.
		try {
			this.updateStatus(InstanceStatus.Connecting, 'Fetching initial state…')
			const snapshot = await this.api.fetchState()
			this._applyState(snapshot)
			this.updateStatus(InstanceStatus.Ok)
		} catch (err) {
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
			this.log('error', `Initial state fetch failed: ${err.message}`)
			// Try again in 10s
			setTimeout(() => this._reconnect().catch(() => {}), 10_000)
			return
		}

		// Open the socket and wire its events to local handlers.
		const showId = this.state.show?.id
		if (showId) {
			this.api.connectSocket(showId)
		}
		this.api.on('connected', () => {
			this.state.connected = true
			this.checkFeedbacks()
			this._refreshVariables()
		})
		this.api.on('disconnected', () => {
			this.state.connected = false
			this.checkFeedbacks()
			this._refreshVariables()
		})
		this.api.on('connect_error', (err) => {
			this.log('warn', `Socket connect error: ${err.message}`)
		})
		this.api.on('state-changed', () => {
			// Any structural event — refetch the canonical state.
			this._pollState().catch((err) => this.log('warn', `State refresh: ${err.message}`))
		})
		this.api.on('time-sync', (data) => {
			// Cheap path — just patch started_at on the active cue if it differs,
			// no full refetch needed.
			if (this.state.activeCue && data?.cueId === this.state.activeCue.id) {
				if (data.startedAt && this.state.activeCue.started_at !== data.startedAt) {
					this.state.activeCue.started_at = data.startedAt
				}
			}
		})
		this.api.on('broadcast-message', (msg) => {
			this.state.broadcastActive = true
			this.state.broadcastText = msg?.text ?? ''
			this.state.broadcastColor = msg?.color ?? ''
			this.checkFeedbacks()
			this._refreshVariables()

			// Cancel any prior auto-clear; a fresh broadcast starts a fresh life.
			if (this.broadcastClearTimer) {
				clearTimeout(this.broadcastClearTimer)
				this.broadcastClearTimer = null
			}

			// Compute when this broadcast naturally ends (if at all). 'hold'
			// stays until cleared explicitly; 'flash' alternates display but
			// also stays until cleared.
			let clearMs = 0
			if (msg?.mode === 'timed' && msg?.expiresAt) {
				clearMs = new Date(msg.expiresAt).getTime() - Date.now()
			} else if (msg?.mode === 'screen-flash') {
				clearMs = ShowCallInstance.SCREEN_FLASH_LIFETIME_MS
			}
			if (clearMs > 0) {
				this.broadcastClearTimer = setTimeout(() => {
					this.state.broadcastActive = false
					this.state.broadcastText = ''
					this.state.broadcastColor = ''
					this.checkFeedbacks()
					this._refreshVariables()
					this.broadcastClearTimer = null
				}, clearMs)
			}
		})
		this.api.on('broadcast-clear', () => {
			this.state.broadcastActive = false
			this.state.broadcastText = ''
			this.state.broadcastColor = ''
			if (this.broadcastClearTimer) {
				clearTimeout(this.broadcastClearTimer)
				this.broadcastClearTimer = null
			}
			this.checkFeedbacks()
			this._refreshVariables()
		})

		// 1Hz tick to keep elapsed/remaining variables flowing.
		if (this.tickInterval) clearInterval(this.tickInterval)
		this.tickInterval = setInterval(() => this._refreshVariables(), 1000)

		// Poll fallback every 30s in case we missed a state event.
		if (this.pollInterval) clearInterval(this.pollInterval)
		this.pollInterval = setInterval(() => {
			this._pollState().catch((err) => this.log('debug', `Poll: ${err.message}`))
		}, 30_000)
	}

	async _pollState() {
		if (!this.api) return
		const snapshot = await this.api.fetchState()
		this._applyState(snapshot)
	}

	_applyState(snapshot) {
		this.state.show = snapshot.show
		this.state.activeCue = snapshot.activeCue
		this.state.nextCue = snapshot.nextCue
		this.state.cuesTotal = snapshot.cuesTotal ?? 0
		this.state.cuesCompleted = snapshot.cuesCompleted ?? 0
		this.state.cuePosition = Number(snapshot.cuePosition) || 0
		this.state.isLive = !!snapshot.isLive
		this.checkFeedbacks()
		this._refreshVariables()
	}

	_refreshVariables() {
		const values = buildVariableValues(this.state.show ? this.state : null, {
			connected: !!this.state.connected,
		})
		this.setVariableValues(values)
		// Some feedbacks depend on elapsed time — re-evaluate on every tick so
		// "over time" / "critical" fire as soon as the threshold is crossed.
		this.checkFeedbacks('cue_over_time', 'cue_critical')
	}

	_elapsedSeconds() {
		const c = this.state.activeCue
		if (!c) return 0
		const accumulated = Number(c.actual_duration_seconds || 0)
		if (!c.started_at) return accumulated
		const iso = String(c.started_at).endsWith('Z') ? c.started_at : c.started_at + 'Z'
		const startMs = new Date(iso).getTime()
		if (!Number.isFinite(startMs)) return accumulated
		const session = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
		return accumulated + session
	}

	async _reconnect() {
		this._teardown()
		await this._connect()
	}

	_teardown() {
		if (this.tickInterval) {
			clearInterval(this.tickInterval)
			this.tickInterval = null
		}
		if (this.pollInterval) {
			clearInterval(this.pollInterval)
			this.pollInterval = null
		}
		if (this.broadcastClearTimer) {
			clearTimeout(this.broadcastClearTimer)
			this.broadcastClearTimer = null
		}
		if (this.api) {
			this.api.disconnectSocket()
			this.api.removeAllListeners()
			this.api = null
		}
		this.state.connected = false
	}
}

runEntrypoint(ShowCallInstance, [])
