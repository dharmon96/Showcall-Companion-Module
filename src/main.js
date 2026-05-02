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
			isLive: false,
			connected: false,
			broadcastActive: false,
		}

		this.api = null
		this.tickInterval = null
		this.pollInterval = null
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'help',
				label: 'How to connect',
				width: 12,
				value:
					'In ShowCall, open <b>Tools → Companion / Stream Deck</b>, create a Companion link, and copy the <b>Connection String</b>. ' +
					'Paste it below — the module will split it into the server URL and token automatically. ' +
					'Or fill the two fields by hand.',
			},
			{
				type: 'textinput',
				id: 'connectionString',
				label: 'Connection String (paste from ShowCall)',
				width: 12,
				default: '',
				tooltip: 'Format: https://your-server|your-token',
			},
			{
				type: 'textinput',
				id: 'serverUrl',
				label: 'Server URL',
				width: 8,
				default: 'https://show.darianharmon.com',
				regex: '/^https?:\\/\\/.+/',
			},
			{
				type: 'textinput',
				id: 'token',
				label: 'Companion Token',
				width: 4,
				default: '',
			},
		]
	}

	/**
	 * If the user pasted a connection string, split it into URL + token before
	 * we try to connect. This keeps the manual fields and the paste field in
	 * sync — on every config update, paste takes precedence if it's filled.
	 */
	_normalizeConfig(config) {
		const next = { ...config }
		const paste = (config.connectionString || '').trim()
		if (paste) {
			const idx = paste.indexOf('|')
			if (idx > 0) {
				next.serverUrl = paste.slice(0, idx).trim()
				next.token = paste.slice(idx + 1).trim()
				// Clear the paste field so future config opens show the parsed
				// fields, not stale paste text.
				next.connectionString = ''
				this.saveConfig(next)
			}
		}
		return next
	}

	async init(config) {
		this.config = this._normalizeConfig(config || {})
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.setPresetDefinitions(definePresets())
		await this._connect()
	}

	async configUpdated(config) {
		this.config = this._normalizeConfig(config || {})
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
		const { serverUrl, token } = this.config
		if (!serverUrl || !token) {
			this.updateStatus(InstanceStatus.BadConfig, 'Server URL + token required')
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
		this.api.on('broadcast-message', () => {
			this.state.broadcastActive = true
			this.checkFeedbacks()
		})
		this.api.on('broadcast-clear', () => {
			this.state.broadcastActive = false
			this.checkFeedbacks()
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
		if (this.api) {
			this.api.disconnectSocket()
			this.api.removeAllListeners()
			this.api = null
		}
		this.state.connected = false
	}
}

runEntrypoint(ShowCallInstance, [])
