/**
 * Companion actions exposed by the ShowCall module.
 *
 * Each action's `callback` receives the action's parsed options and triggers
 * the matching ShowCall API call. We intentionally keep this list focused on
 * the live-call surface — anything richer (creating cues, editing depts, etc.)
 * stays in the web UI.
 */

// Reusable broadcast option set so send + toggle stay consistent.
function broadcastOptions() {
	return [
		{ id: 'text', type: 'textinput', label: 'Message', default: '', useVariables: true },
		{
			id: 'mode',
			type: 'dropdown',
			label: 'Mode',
			default: 'hold',
			choices: [
				{ id: 'hold', label: 'Hold (until cleared)' },
				{ id: 'timed', label: 'Timed (auto-clear after N seconds)' },
				{ id: 'flash', label: 'Flash (alternating display)' },
				{ id: 'screen-flash', label: 'Screen Flash (fullscreen color pulses)' },
			],
		},
		{
			id: 'color',
			type: 'dropdown',
			label: 'Color',
			default: 'orange',
			choices: [
				{ id: 'orange', label: 'Orange' },
				{ id: 'red', label: 'Red' },
				{ id: 'amber', label: 'Amber' },
				{ id: 'green', label: 'Green' },
				{ id: 'cyan', label: 'Cyan' },
				{ id: 'violet', label: 'Violet' },
			],
		},
		{
			id: 'durationSeconds',
			type: 'number',
			label: 'Duration (seconds — timed mode)',
			default: 10,
			min: 1,
			max: 600,
			isVisible: (opts) => opts.mode === 'timed',
		},
		{
			id: 'screenFlashCount',
			type: 'number',
			label: 'Pulses (screen-flash mode)',
			default: 3,
			min: 1,
			max: 20,
			isVisible: (opts) => opts.mode === 'screen-flash',
		},
		{
			id: 'targetDeptIds',
			type: 'textinput',
			label: 'Target dept IDs (comma-separated, blank = everyone)',
			default: '',
			useVariables: true,
			tooltip: 'Optional. Numeric department IDs from your ShowCall show, comma-separated. Leave blank to broadcast to everyone.',
		},
	]
}

function buildBroadcastPayload(text, opts) {
	const ids = (opts.targetDeptIds || '')
		.split(',')
		.map((s) => parseInt(String(s).trim(), 10))
		.filter((n) => Number.isFinite(n) && n > 0)
	return {
		text,
		mode: opts.mode,
		color: opts.color,
		durationSeconds: opts.mode === 'timed' ? Number(opts.durationSeconds) : undefined,
		screenFlashCount: opts.mode === 'screen-flash' ? Number(opts.screenFlashCount) : undefined,
		targetDeptIds: ids.length > 0 ? ids : undefined,
	}
}

export function defineActions(self) {
	return {
		advance: {
			name: 'GO / Advance Cue',
			description: "Advance to the next cue. If no cue is active and the show isn't live yet, this also goes live and activates the first advanceable cue.",
			options: [],
			callback: async () => {
				try {
					await self.api.advance()
				} catch (err) {
					self.log('warn', `advance: ${err.message}`)
				}
			},
		},

		back: {
			name: 'Back / Previous Cue',
			description: 'Step backwards to the previous advanceable cue.',
			options: [],
			callback: async () => {
				try {
					await self.api.back()
				} catch (err) {
					self.log('warn', `back: ${err.message}`)
				}
			},
		},

		go_live: {
			name: 'Go Live',
			description: 'Mark the show as live and activate the first cue.',
			options: [],
			callback: async () => {
				try {
					await self.api.goLive()
				} catch (err) {
					self.log('warn', `go_live: ${err.message}`)
				}
			},
		},

		stop: {
			name: 'Stop Show',
			description: 'End the show (sets status to completed).',
			options: [],
			callback: async () => {
				try {
					await self.api.stop()
				} catch (err) {
					self.log('warn', `stop: ${err.message}`)
				}
			},
		},

		go_to_cue: {
			name: 'Go to Specific Cue',
			description: 'Jump directly to a cue by its cue number (e.g. "Q3", "1.5").',
			options: [
				{
					id: 'cueNumber',
					type: 'textinput',
					label: 'Cue Number',
					default: '',
					useVariables: true,
					tooltip: "The 'Cue #' value as it appears in ShowCall (not the database id).",
				},
			],
			callback: async (action) => {
				const cueNumber = await self.parseVariablesInString(action.options.cueNumber || '')
				if (!cueNumber) {
					self.log('warn', 'go_to_cue: cue number is empty')
					return
				}
				try {
					await self.api.goToCue({ cueNumber })
				} catch (err) {
					self.log('warn', `go_to_cue: ${err.message}`)
				}
			},
		},

		reset_active_cue_timer: {
			name: 'Reset Active Cue Timer',
			description: 'Reset the active cue elapsed timer to 0:00 for everyone watching.',
			options: [],
			callback: async () => {
				try {
					await self.api.resetTimer()
				} catch (err) {
					self.log('warn', `reset_active_cue_timer: ${err.message}`)
				}
			},
		},

		toggle_hold_active: {
			name: 'Toggle Hold on Active Cue',
			description: 'Pause/resume the active cue (sets the on_hold flag).',
			options: [],
			callback: async () => {
				try {
					await self.api.toggleHold()
				} catch (err) {
					self.log('warn', `toggle_hold_active: ${err.message}`)
				}
			},
		},

		// Smart toggle: if THIS exact text is already broadcasting, clear it;
		// otherwise send (or replace whatever was up). Same shape for both
		// broadcast_message and broadcast_toggle so pre-v0.3.1 buttons work
		// correctly without needing to re-drop a preset.
		broadcast_message: {
			name: 'Send / Toggle Broadcast Banner',
			description: "Press once to send the banner; press again with the same text to clear it. Pair with the 'Broadcast Matches' feedback so the button glows while its message is the active broadcast.",
			options: broadcastOptions(),
			callback: async (action) => {
				const text = await self.parseVariablesInString(action.options.text || '')
				if (!text) {
					self.log('warn', 'broadcast_message: text is empty')
					return
				}
				try {
					if (self.state?.broadcastText && self.state.broadcastText === text) {
						await self.api.clearBroadcast()
					} else {
						await self.api.broadcast(buildBroadcastPayload(text, action.options))
					}
				} catch (err) {
					self.log('warn', `broadcast_message: ${err.message}`)
				}
			},
		},

		// Alias of broadcast_message kept for users whose v0.3.0 buttons explicitly
		// chose 'Toggle Broadcast Banner'. Behaviour is identical.
		broadcast_toggle: {
			name: 'Toggle Broadcast Banner (alias)',
			description: 'Same as Send / Toggle Broadcast Banner — kept as a separate id for compatibility with v0.3.0 buttons.',
			options: broadcastOptions(),
			callback: async (action) => {
				const text = await self.parseVariablesInString(action.options.text || '')
				if (!text) {
					self.log('warn', 'broadcast_toggle: text is empty')
					return
				}
				try {
					if (self.state?.broadcastText && self.state.broadcastText === text) {
						await self.api.clearBroadcast()
					} else {
						await self.api.broadcast(buildBroadcastPayload(text, action.options))
					}
				} catch (err) {
					self.log('warn', `broadcast_toggle: ${err.message}`)
				}
			},
		},

		clear_broadcast: {
			name: 'Clear Broadcast Banner',
			description: 'Dismiss the active broadcast banner for everyone.',
			options: [],
			callback: async () => {
				try {
					await self.api.clearBroadcast()
				} catch (err) {
					self.log('warn', `clear_broadcast: ${err.message}`)
				}
			},
		},
	}
}
