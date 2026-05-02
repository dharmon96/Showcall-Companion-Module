/**
 * ShowCall API client used by the Companion module.
 *
 * Hosts both:
 *  - HTTPS calls to the `/api/companion/:token/*` endpoints (actions + state)
 *  - A Socket.IO connection to the show room for real-time cue updates
 *
 * Emits events the module listens to so it can update variables and feedbacks
 * without polling.
 */

import { EventEmitter } from 'events'
import { io } from 'socket.io-client'

export class ShowCallApi extends EventEmitter {
	/**
	 * @param {string} serverUrl  e.g. https://show.darianharmon.com
	 * @param {string} token      showcaller-level share token
	 * @param {(level: 'debug'|'info'|'warn'|'error', msg: string) => void} log
	 */
	constructor(serverUrl, token, log) {
		super()
		this.serverUrl = serverUrl.replace(/\/+$/, '')
		this.token = token
		this.log = log || (() => {})
		this.socket = null
		this.lastShowId = null
	}

	/**
	 * Pull a fresh state snapshot. Called once on connect to hydrate everything,
	 * then again periodically as a poll fallback (in case a socket event went
	 * missing). Returns the parsed JSON body or throws.
	 */
	async fetchState() {
		const url = `${this.serverUrl}/api/companion/${encodeURIComponent(this.token)}/state`
		const res = await fetch(url, { method: 'GET' })
		if (!res.ok) {
			const body = await res.text().catch(() => '')
			throw new Error(`State fetch failed (${res.status}): ${body || res.statusText}`)
		}
		return res.json()
	}

	/**
	 * POST to a `/api/companion/:token/<action>` endpoint with an optional body.
	 */
	async postAction(action, body) {
		const url = `${this.serverUrl}/api/companion/${encodeURIComponent(this.token)}/${action}`
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: body ? JSON.stringify(body) : undefined,
		})
		if (!res.ok) {
			const errBody = await res.text().catch(() => '')
			throw new Error(`Action '${action}' failed (${res.status}): ${errBody || res.statusText}`)
		}
		return res.json().catch(() => ({}))
	}

	advance() { return this.postAction('advance') }
	back() { return this.postAction('back') }
	goLive() { return this.postAction('go-live') }
	stop() { return this.postAction('stop') }
	resetTimer() { return this.postAction('reset-timer') }
	goToCue({ cueId, cueNumber }) { return this.postAction('go-to', { cueId, cueNumber }) }
	toggleHold({ cueId } = {}) { return this.postAction('hold', cueId !== undefined ? { cueId } : {}) }
	broadcast({ text, mode = 'persistent', color = 'orange', durationSeconds, flashIntervalMs }) {
		return this.postAction('broadcast', { text, mode, color, durationSeconds, flashIntervalMs })
	}
	clearBroadcast() { return this.postAction('broadcast/clear') }

	/**
	 * Open a Socket.IO connection to the show room. Re-fires the events the
	 * module cares about as our own so the consumer doesn't need socket.io
	 * specifics. Auto-joins the show room once we know the show id (either
	 * from a passed-in showId or after the first state fetch).
	 *
	 * @param {number} showId
	 */
	connectSocket(showId) {
		if (this.socket) {
			this.disconnectSocket()
		}
		this.lastShowId = showId

		const socket = io(this.serverUrl, {
			transports: ['websocket'],
			withCredentials: true,
			query: { viewer: 'true' },
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 10000,
		})

		socket.on('connect', () => {
			this.log('debug', `Socket connected (${socket.id})`)
			socket.emit('join-show', {
				showId,
				userId: `companion-${this.token.slice(0, 8)}`,
				userName: 'Companion',
				role: 'showcaller',
			})
			this.emit('connected')
		})

		socket.on('disconnect', (reason) => {
			this.log('debug', `Socket disconnected (${reason})`)
			this.emit('disconnected', reason)
		})

		socket.on('connect_error', (err) => {
			this.log('warn', `Socket connect error: ${err.message}`)
			this.emit('connect_error', err)
		})

		// Cue/show lifecycle events — re-emit everything the module needs in a
		// single 'state-changed' for simplicity. Module listens, refetches state.
		const stateEvents = [
			'cue:advance',
			'cue:status-changed',
			'cue:hold-changed',
			'cue:updated',
			'show:go-live',
			'show:completed',
			'show:reset',
			'cue:created',
			'cue:deleted',
			'cue:reordered',
		]
		for (const ev of stateEvents) {
			socket.on(ev, (data) => this.emit('state-changed', { event: ev, data }))
		}

		// time:sync — periodic re-broadcast of the active cue's started_at; we
		// only need to nudge variables, no full refetch.
		socket.on('time:sync', (data) => this.emit('time-sync', data))

		// broadcast banner events — useful for feedback like "broadcast active".
		socket.on('broadcast:message', (msg) => this.emit('broadcast-message', msg))
		socket.on('broadcast:clear', () => this.emit('broadcast-clear'))

		this.socket = socket
	}

	disconnectSocket() {
		if (this.socket) {
			try { this.socket.disconnect() } catch { /* ignore */ }
			this.socket = null
		}
	}
}
