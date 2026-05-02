/**
 * Companion feedbacks — paint Stream Deck buttons based on live state.
 *
 * Each feedback returns a style override (background/text colour) when its
 * condition is true. The module re-evaluates feedbacks on every state change.
 */

import { combineRgb } from '@companion-module/base'

export function defineFeedbacks(self) {
	return {
		is_live: {
			type: 'boolean',
			name: 'Show is Live',
			description: 'Highlights when the show status is "live".',
			defaultStyle: {
				bgcolor: combineRgb(220, 38, 38), // red-600
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.state?.isLive === true,
		},

		cue_active: {
			type: 'boolean',
			name: 'Specific Cue is Active',
			description: 'Highlights when the cue with a given Cue Number is currently active.',
			defaultStyle: {
				bgcolor: combineRgb(34, 197, 94), // green-500
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'cueNumber',
					type: 'textinput',
					label: 'Cue Number',
					default: '',
					useVariables: true,
				},
			],
			callback: async (feedback) => {
				const target = await self.parseVariablesInString(feedback.options.cueNumber || '')
				if (!target) return false
				return self.state?.activeCue?.cue_number === target
			},
		},

		cue_over_time: {
			type: 'boolean',
			name: 'Active Cue is Over Time',
			description: 'Highlights when the active cue has run past its planned duration.',
			defaultStyle: {
				bgcolor: combineRgb(239, 68, 68), // red-500
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const c = self.state?.activeCue
				if (!c?.duration_seconds) return false
				const elapsed = self._elapsedSeconds()
				return elapsed > c.duration_seconds
			},
		},

		cue_critical: {
			type: 'boolean',
			name: 'Active Cue is in Critical Window',
			description: 'Highlights when the active cue has less than N seconds remaining.',
			defaultStyle: {
				bgcolor: combineRgb(234, 179, 8), // yellow-500
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'thresholdSeconds',
					type: 'number',
					label: 'Threshold (seconds)',
					default: 10,
					min: 1,
					max: 600,
				},
			],
			callback: (feedback) => {
				const c = self.state?.activeCue
				if (!c?.duration_seconds) return false
				const elapsed = self._elapsedSeconds()
				const remaining = c.duration_seconds - elapsed
				const threshold = Number(feedback.options.thresholdSeconds) || 10
				return remaining > 0 && remaining <= threshold
			},
		},

		cue_on_hold: {
			type: 'boolean',
			name: 'Active Cue is On Hold',
			description: 'Highlights when the active cue is paused (on_hold = 1).',
			defaultStyle: {
				bgcolor: combineRgb(234, 179, 8),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => !!self.state?.activeCue?.on_hold,
		},

		broadcast_active: {
			type: 'boolean',
			name: 'Broadcast Banner Visible',
			description: 'Highlights while a broadcast banner is being shown to viewers.',
			defaultStyle: {
				bgcolor: combineRgb(249, 115, 22), // orange-500
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => !!self.state?.broadcastActive,
		},

		connected: {
			type: 'boolean',
			name: 'Connected to ShowCall',
			description: 'Highlights when the module is successfully connected to the ShowCall server.',
			defaultStyle: {
				bgcolor: combineRgb(34, 197, 94),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => !!self.state?.connected,
		},
	}
}
