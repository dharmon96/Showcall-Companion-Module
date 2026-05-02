/**
 * Companion actions exposed by the ShowCall module.
 *
 * Each action's `callback` receives the action's parsed options and triggers
 * the matching ShowCall API call. We intentionally keep this list focused on
 * the live-call surface — anything richer (creating cues, editing depts, etc.)
 * stays in the web UI.
 */

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

		broadcast_message: {
			name: 'Send Broadcast Banner',
			description: 'Push a banner message to every connected viewer.',
			options: [
				{
					id: 'text',
					type: 'textinput',
					label: 'Message',
					default: '',
					useVariables: true,
				},
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'persistent',
					choices: [
						{ id: 'persistent', label: 'Persistent (until cleared)' },
						{ id: 'timed', label: 'Timed (auto-clear after N seconds)' },
						{ id: 'flash', label: 'Flash (alternating display)' },
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
						{ id: 'yellow', label: 'Yellow' },
						{ id: 'green', label: 'Green' },
						{ id: 'blue', label: 'Blue' },
						{ id: 'purple', label: 'Purple' },
					],
				},
				{
					id: 'durationSeconds',
					type: 'number',
					label: 'Duration (seconds, timed mode only)',
					default: 10,
					min: 1,
					max: 600,
					isVisible: (opts) => opts.mode === 'timed',
				},
			],
			callback: async (action) => {
				const text = await self.parseVariablesInString(action.options.text || '')
				if (!text) {
					self.log('warn', 'broadcast_message: text is empty')
					return
				}
				try {
					await self.api.broadcast({
						text,
						mode: action.options.mode,
						color: action.options.color,
						durationSeconds: action.options.mode === 'timed' ? Number(action.options.durationSeconds) : undefined,
					})
				} catch (err) {
					self.log('warn', `broadcast_message: ${err.message}`)
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
