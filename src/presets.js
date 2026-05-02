/**
 * Ready-to-use button presets. Drop these onto a Stream Deck for an instant
 * showcaller layout. Users can still build custom buttons with the actions /
 * variables / feedbacks defined elsewhere.
 */

import { combineRgb } from '@companion-module/base'

export function definePresets() {
	return {
		go: {
			category: 'Show Control',
			name: 'GO',
			type: 'button',
			style: {
				text: 'GO\\n$(darianharmon-showcall:cue_number)\\n$(darianharmon-showcall:cue_remaining)',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(34, 197, 94),
			},
			steps: [
				{
					down: [{ actionId: 'advance', options: {} }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'cue_over_time',
					options: {},
					style: { bgcolor: combineRgb(239, 68, 68), color: combineRgb(255, 255, 255) },
				},
				{
					feedbackId: 'cue_critical',
					options: { thresholdSeconds: 10 },
					style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) },
				},
			],
		},

		back: {
			category: 'Show Control',
			name: 'Back',
			type: 'button',
			style: {
				text: 'BACK',
				size: '18',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(75, 85, 99), // gray-600
			},
			steps: [
				{ down: [{ actionId: 'back', options: {} }], up: [] },
			],
			feedbacks: [],
		},

		go_live: {
			category: 'Show Control',
			name: 'Go Live',
			type: 'button',
			style: {
				text: 'GO LIVE',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(124, 58, 237), // violet-600
			},
			steps: [
				{ down: [{ actionId: 'go_live', options: {} }], up: [] },
			],
			feedbacks: [
				{
					feedbackId: 'is_live',
					options: {},
					style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) },
				},
			],
		},

		stop: {
			category: 'Show Control',
			name: 'Stop',
			type: 'button',
			style: {
				text: 'STOP',
				size: '18',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(31, 41, 55),
			},
			steps: [
				{ down: [{ actionId: 'stop', options: {} }], up: [] },
			],
			feedbacks: [],
		},

		reset_timer: {
			category: 'Show Control',
			name: 'Reset Cue Timer',
			type: 'button',
			style: {
				text: 'RESET\\nTIMER',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(59, 130, 246), // blue-500
			},
			steps: [
				{ down: [{ actionId: 'reset_active_cue_timer', options: {} }], up: [] },
			],
			feedbacks: [],
		},

		hold: {
			category: 'Show Control',
			name: 'Toggle Hold',
			type: 'button',
			style: {
				text: 'HOLD',
				size: '18',
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(250, 204, 21), // yellow-400
			},
			steps: [
				{ down: [{ actionId: 'toggle_hold_active', options: {} }], up: [] },
			],
			feedbacks: [
				{
					feedbackId: 'cue_on_hold',
					options: {},
					style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) },
				},
			],
		},

		current_cue_display: {
			category: 'Display',
			name: 'Current Cue',
			type: 'button',
			style: {
				text: '$(darianharmon-showcall:cue_number)\\n$(darianharmon-showcall:cue_title)',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(31, 41, 55),
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [],
		},

		cue_timer_display: {
			category: 'Display',
			name: 'Cue Time / Total',
			type: 'button',
			style: {
				text: '$(darianharmon-showcall:cue_elapsed)\\n/\\n$(darianharmon-showcall:cue_duration)',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(17, 24, 39),
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: 'cue_over_time',
					options: {},
					style: { bgcolor: combineRgb(239, 68, 68), color: combineRgb(255, 255, 255) },
				},
				{
					feedbackId: 'cue_critical',
					options: { thresholdSeconds: 10 },
					style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) },
				},
			],
		},

		next_cue_display: {
			category: 'Display',
			name: 'Next Cue',
			type: 'button',
			style: {
				text: 'NEXT\\n$(darianharmon-showcall:next_cue_number)\\n$(darianharmon-showcall:next_cue_title)',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(55, 65, 81),
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [],
		},

		clear_broadcast: {
			category: 'Broadcast',
			name: 'Clear Broadcast',
			type: 'button',
			style: {
				text: 'CLEAR\\nBROADCAST',
				size: '12',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(75, 85, 99),
			},
			steps: [
				{ down: [{ actionId: 'clear_broadcast', options: {} }], up: [] },
			],
			feedbacks: [
				{
					feedbackId: 'broadcast_active',
					options: {},
					style: { bgcolor: combineRgb(249, 115, 22), color: combineRgb(0, 0, 0) },
				},
			],
		},
	}
}
