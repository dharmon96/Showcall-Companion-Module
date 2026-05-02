/**
 * Companion button presets — drag-and-drop ready buttons users can drop onto
 * a Stream Deck. Organised into categories so the preset picker is easy to
 * scan, similar to how the Resolume module groups by transport / layer /
 * clip etc.
 */

import { combineRgb } from '@companion-module/base'

// ── Color palette ──────────────────────────────────────────
const COL = {
	white: combineRgb(255, 255, 255),
	black: combineRgb(0, 0, 0),
	green: combineRgb(34, 197, 94), // 500
	greenDeep: combineRgb(22, 163, 74), // 600
	red: combineRgb(239, 68, 68),
	redDeep: combineRgb(220, 38, 38),
	yellow: combineRgb(234, 179, 8),
	yellowSoft: combineRgb(250, 204, 21),
	orange: combineRgb(249, 115, 22),
	blue: combineRgb(59, 130, 246),
	violet: combineRgb(124, 58, 237),
	gray700: combineRgb(55, 65, 81),
	gray600: combineRgb(75, 85, 99),
	gray800: combineRgb(31, 41, 55),
	gray900: combineRgb(17, 24, 39),
}

// Helper for one-step "press triggers an action" buttons.
function pressAction(actionId, options = {}) {
	return [{ down: [{ actionId, options }], up: [] }]
}

// Helper for static display-only buttons (no action).
const noAction = [{ down: [], up: [] }]

// Common feedbacks used on multiple buttons.
const cueOverFeedback = {
	feedbackId: 'cue_over_time',
	options: {},
	style: { bgcolor: COL.red, color: COL.white },
}
const cueCriticalFeedback = (thresholdSeconds = 10) => ({
	feedbackId: 'cue_critical',
	options: { thresholdSeconds },
	style: { bgcolor: COL.yellow, color: COL.black },
})
const onHoldFeedback = {
	feedbackId: 'cue_on_hold',
	options: {},
	style: { bgcolor: COL.yellow, color: COL.black },
}
const isLiveFeedback = {
	feedbackId: 'is_live',
	options: {},
	style: { bgcolor: COL.redDeep, color: COL.white },
}
const broadcastActiveFeedback = {
	feedbackId: 'broadcast_active',
	options: {},
	style: { bgcolor: COL.orange, color: COL.black },
}
const connectedFeedback = {
	feedbackId: 'connected',
	options: {},
	style: { bgcolor: COL.green, color: COL.black },
}

export function definePresets() {
	const presets = {}

	// ── 1. Show Control ────────────────────────────────────
	presets.go = {
		category: 'Show Control',
		name: 'GO',
		type: 'button',
		style: {
			text: 'GO\\n$(mantaglow-showcall:cue_number)\\n$(mantaglow-showcall:cue_remaining)',
			size: '14',
			color: COL.white,
			bgcolor: COL.green,
		},
		steps: pressAction('advance'),
		feedbacks: [cueOverFeedback, cueCriticalFeedback(10)],
	}

	presets.go_simple = {
		category: 'Show Control',
		name: 'GO (simple)',
		type: 'button',
		style: { text: 'GO', size: '24', color: COL.white, bgcolor: COL.green },
		steps: pressAction('advance'),
		feedbacks: [],
	}

	presets.back = {
		category: 'Show Control',
		name: 'Back',
		type: 'button',
		style: { text: 'BACK', size: '18', color: COL.white, bgcolor: COL.gray600 },
		steps: pressAction('back'),
		feedbacks: [],
	}

	presets.go_live = {
		category: 'Show Control',
		name: 'Go Live',
		type: 'button',
		style: { text: 'GO LIVE', size: '14', color: COL.white, bgcolor: COL.violet },
		steps: pressAction('go_live'),
		feedbacks: [isLiveFeedback],
	}

	presets.stop = {
		category: 'Show Control',
		name: 'Stop',
		type: 'button',
		style: { text: 'STOP', size: '18', color: COL.white, bgcolor: COL.gray800 },
		steps: pressAction('stop'),
		feedbacks: [],
	}

	presets.reset_timer = {
		category: 'Show Control',
		name: 'Reset Cue Timer',
		type: 'button',
		style: { text: 'RESET\\nTIMER', size: '14', color: COL.white, bgcolor: COL.blue },
		steps: pressAction('reset_active_cue_timer'),
		feedbacks: [],
	}

	presets.hold = {
		category: 'Show Control',
		name: 'Toggle Hold',
		type: 'button',
		style: { text: 'HOLD', size: '18', color: COL.black, bgcolor: COL.yellowSoft },
		steps: pressAction('toggle_hold_active'),
		feedbacks: [onHoldFeedback],
	}

	// "Smart GO" — same press behaviour, but the label changes based on state.
	// Variables ensure it shows "GO LIVE" before the show is live and "GO"
	// once it's running. The action itself is `advance` because the server
	// auto-go-lives if no cue is active yet.
	presets.smart_go = {
		category: 'Show Control',
		name: 'Smart GO (auto Go Live)',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:is_live)1?GO\\n$(mantaglow-showcall:cue_number)\\n$(mantaglow-showcall:cue_remaining):GO LIVE',
			size: '14',
			color: COL.white,
			bgcolor: COL.green,
		},
		steps: pressAction('advance'),
		feedbacks: [cueOverFeedback, cueCriticalFeedback(10)],
	}

	// ── 2. Display ─────────────────────────────────────────
	presets.current_cue = {
		category: 'Display',
		name: 'Current Cue',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:cue_number)\\n$(mantaglow-showcall:cue_title)',
			size: '14',
			color: COL.white,
			bgcolor: COL.gray800,
		},
		steps: noAction,
		feedbacks: [],
	}

	presets.cue_timer = {
		category: 'Display',
		name: 'Cue Time / Planned',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:cue_elapsed)\\n/\\n$(mantaglow-showcall:cue_duration)',
			size: '14',
			color: COL.white,
			bgcolor: COL.gray900,
		},
		steps: noAction,
		feedbacks: [cueOverFeedback, cueCriticalFeedback(10)],
	}

	presets.cue_timer_escalating = {
		category: 'Display',
		name: 'Cue Timer (4-step color escalation)',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:cue_elapsed)\\n/\\n$(mantaglow-showcall:cue_duration)',
			size: '14',
			color: COL.black,
			bgcolor: COL.green, // base: green when fresh
		},
		steps: noAction,
		// Order matters — Companion stacks feedbacks, later ones override earlier.
		// Layer: warning (75%) → critical (10s left) → over-time.
		feedbacks: [
			{
				feedbackId: 'cue_warning',
				options: { pctThreshold: 75 },
				style: { bgcolor: combineRgb(245, 158, 11), color: COL.black },
			},
			{
				feedbackId: 'cue_critical',
				options: { thresholdSeconds: 10 },
				style: { bgcolor: COL.yellow, color: COL.black },
			},
			cueOverFeedback,
		],
	}

	presets.cue_remaining = {
		category: 'Display',
		name: 'Cue Remaining',
		type: 'button',
		style: {
			text: 'REMAINING\\n$(mantaglow-showcall:cue_remaining)',
			size: '14',
			color: COL.white,
			bgcolor: COL.gray900,
		},
		steps: noAction,
		feedbacks: [cueOverFeedback, cueCriticalFeedback(10)],
	}

	presets.next_cue = {
		category: 'Display',
		name: 'Next Cue',
		type: 'button',
		style: {
			text: 'NEXT\\n$(mantaglow-showcall:next_cue_number)\\n$(mantaglow-showcall:next_cue_title)',
			size: '14',
			color: COL.white,
			bgcolor: COL.gray700,
		},
		steps: noAction,
		feedbacks: [],
	}

	presets.show_name = {
		category: 'Display',
		name: 'Show Name',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:show_name)',
			size: '14',
			color: COL.white,
			bgcolor: COL.gray800,
		},
		steps: noAction,
		feedbacks: [],
	}

	presets.show_status = {
		category: 'Display',
		name: 'Show Status',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:show_status)',
			size: '18',
			color: COL.white,
			bgcolor: COL.gray800,
		},
		steps: noAction,
		feedbacks: [isLiveFeedback],
	}

	presets.show_elapsed = {
		category: 'Display',
		name: 'Show Elapsed',
		type: 'button',
		style: {
			text: 'SHOW\\n$(mantaglow-showcall:show_elapsed)',
			size: '14',
			color: COL.white,
			bgcolor: COL.gray800,
		},
		steps: noAction,
		feedbacks: [],
	}

	presets.cues_progress = {
		category: 'Display',
		name: 'Cues Completed (count)',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:cues_completed)\\n/\\n$(mantaglow-showcall:cues_total)',
			size: '18',
			color: COL.white,
			bgcolor: COL.gray800,
		},
		steps: noAction,
		feedbacks: [],
	}

	// "Where are we?" preset using cue_position — this reads "10 / 16" when
	// the active cue is the 10th advanceable cue, regardless of whether the
	// previous 9 are formally marked completed (handy after jump-to-cue).
	presets.cue_position_display = {
		category: 'Display',
		name: 'Cue Position (10 / 16)',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:cue_position)\\n/\\n$(mantaglow-showcall:cues_total)',
			size: '18',
			color: COL.white,
			bgcolor: COL.gray800,
		},
		steps: noAction,
		feedbacks: [],
	}

	presets.connection_status = {
		category: 'Display',
		name: 'Connection Status',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:connected)1?CONNECTED:OFFLINE',
			size: '14',
			color: COL.white,
			bgcolor: COL.gray700,
		},
		steps: noAction,
		feedbacks: [connectedFeedback],
	}

	// ── 3. Cue Navigation ──────────────────────────────────
	// User edits the Cue Number after dropping onto a button.
	presets.go_to_cue_template = {
		category: 'Cue Navigation',
		name: 'Go to Cue (template — set Cue #)',
		type: 'button',
		style: {
			text: 'CUE\\n[set]',
			size: '14',
			color: COL.white,
			bgcolor: COL.violet,
		},
		steps: [{ down: [{ actionId: 'go_to_cue', options: { cueNumber: '' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'cue_active',
				options: { cueNumber: '' },
				style: { bgcolor: COL.green, color: COL.black },
			},
		],
	}

	// A few pre-numbered shortcuts users can edit in place. These match the
	// "1, 2, 3…" cue numbers most shows use; rename the button label and the
	// option to point at any cue.
	for (const n of [1, 2, 3, 4, 5]) {
		presets[`go_to_cue_${n}`] = {
			category: 'Cue Navigation',
			name: `Go to Cue ${n}`,
			type: 'button',
			style: {
				text: `CUE ${n}`,
				size: '24',
				color: COL.white,
				bgcolor: COL.gray700,
			},
			steps: [{ down: [{ actionId: 'go_to_cue', options: { cueNumber: String(n) } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'cue_active',
					options: { cueNumber: String(n) },
					style: { bgcolor: COL.green, color: COL.black },
				},
			],
		}
	}

	// ── 4. Quick Broadcasts ────────────────────────────────
	// Pre-built broadcast banners. These use the broadcast_toggle action so
	// pressing the button a second time clears the banner — pair with the
	// broadcast_matches feedback so the button glows while *its* message is
	// the active one. Edit text/colour/duration on the button after dropping.
	const quickBroadcasts = [
		{ id: 'standby',   label: 'STAND BY',   text: 'STAND BY',                    color: 'orange', mode: 'hold' },
		{ id: 'go_in_5',   label: '5 MIN',      text: '5 MINUTES TO SHOW',           color: 'amber',  mode: 'timed', durationSeconds: 60 },
		{ id: 'go_in_1',   label: '1 MIN',      text: '1 MINUTE TO SHOW',            color: 'red',    mode: 'timed', durationSeconds: 60 },
		{ id: 'going_live',label: 'GOING LIVE', text: 'GOING LIVE NOW',              color: 'green',  mode: 'flash' },
		{ id: 'hold_msg',  label: 'HOLD',       text: 'HOLD — DO NOT START',         color: 'amber',  mode: 'hold' },
		{ id: 'all_clear', label: 'ALL CLEAR',  text: 'ALL CLEAR — RESUME',          color: 'green',  mode: 'timed', durationSeconds: 8 },
		{ id: 'wrap',      label: 'WRAP',       text: "THAT'S A WRAP — THANK YOU",   color: 'cyan',   mode: 'timed', durationSeconds: 12 },
		{ id: 'alert',     label: 'ALERT',      text: 'ALERT',                       color: 'red',    mode: 'screen-flash', screenFlashCount: 5 },
	]

	const colorBg = (c) =>
		c === 'red' ? COL.red :
		c === 'green' ? COL.green :
		c === 'amber' ? COL.yellow :
		c === 'cyan' ? COL.blue :
		c === 'orange' ? COL.orange :
		COL.violet

	for (const b of quickBroadcasts) {
		presets[`broadcast_${b.id}`] = {
			category: 'Quick Broadcasts',
			name: `Broadcast: ${b.label}`,
			type: 'button',
			style: {
				text: b.label,
				size: '14',
				color: b.color === 'amber' || b.color === 'green' ? COL.black : COL.white,
				bgcolor: colorBg(b.color),
			},
			steps: [{
				down: [{
					actionId: 'broadcast_toggle',
					options: {
						text: b.text,
						mode: b.mode,
						color: b.color,
						durationSeconds: b.durationSeconds ?? 10,
						screenFlashCount: b.screenFlashCount ?? 3,
						targetDeptIds: '',
					},
				}],
				up: [],
			}],
			feedbacks: [
				{
					feedbackId: 'broadcast_matches',
					options: { text: b.text },
					style: {
						bgcolor: COL.white,
						color: colorBg(b.color),
					},
				},
			],
		}
	}

	presets.broadcast_template = {
		category: 'Quick Broadcasts',
		name: 'Broadcast (template — set message)',
		type: 'button',
		style: { text: 'BROAD\\nCAST', size: '14', color: COL.white, bgcolor: COL.orange },
		steps: [{
			down: [{
				actionId: 'broadcast_toggle',
				options: { text: '', mode: 'hold', color: 'orange', durationSeconds: 10, screenFlashCount: 3, targetDeptIds: '' },
			}],
			up: [],
		}],
		feedbacks: [broadcastActiveFeedback],
	}

	presets.clear_broadcast = {
		category: 'Quick Broadcasts',
		name: 'Clear Broadcast',
		type: 'button',
		style: { text: 'CLEAR\\nBROADCAST', size: '12', color: COL.white, bgcolor: COL.gray600 },
		steps: pressAction('clear_broadcast'),
		feedbacks: [broadcastActiveFeedback],
	}

	// ── 5. Combo / Smart Buttons ───────────────────────────
	// One button = display + action. Users who only have a few keys on their
	// surface love these.
	presets.combo_go_with_cue = {
		category: 'Combo',
		name: 'GO + Current Cue (one button)',
		type: 'button',
		style: {
			text: '$(mantaglow-showcall:cue_number)\\n$(mantaglow-showcall:cue_title)\\n$(mantaglow-showcall:cue_remaining)',
			size: '12',
			color: COL.white,
			bgcolor: COL.green,
		},
		steps: pressAction('advance'),
		feedbacks: [cueOverFeedback, cueCriticalFeedback(10)],
	}

	presets.combo_back_with_label = {
		category: 'Combo',
		name: 'Back + Label',
		type: 'button',
		style: {
			text: '←\\nPREV CUE',
			size: '14',
			color: COL.white,
			bgcolor: COL.gray700,
		},
		steps: pressAction('back'),
		feedbacks: [],
	}

	return presets
}
