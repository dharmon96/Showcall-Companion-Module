/**
 * Companion variable definitions + a helper to refresh values from the
 * latest state snapshot. Every value the user might want on a Stream Deck
 * label is exposed here.
 */

export function defineVariables() {
	return [
		// Show-level
		{ variableId: 'show_name', name: 'Show Name' },
		{ variableId: 'show_status', name: 'Show Status (draft / rehearsal / live / completed)' },
		{ variableId: 'is_live', name: 'Is Live (1 / 0)' },
		{ variableId: 'cues_total', name: 'Total Advanceable Cues' },
		{ variableId: 'cues_completed', name: 'Completed Cues Count' },
		{ variableId: 'show_elapsed', name: 'Show Elapsed (m:ss)' },

		// Active cue
		{ variableId: 'cue_number', name: 'Active Cue Number' },
		{ variableId: 'cue_title', name: 'Active Cue Title' },
		{ variableId: 'cue_duration', name: 'Active Cue Planned Duration (m:ss)' },
		{ variableId: 'cue_elapsed', name: 'Active Cue Elapsed (m:ss)' },
		{ variableId: 'cue_remaining', name: 'Active Cue Remaining (m:ss, negative = over)' },
		{ variableId: 'cue_over_by', name: 'Active Cue Over Time (m:ss, blank when under)' },
		{ variableId: 'cue_is_on_hold', name: 'Active Cue On Hold (1 / 0)' },

		// Next cue
		{ variableId: 'next_cue_number', name: 'Next Cue Number' },
		{ variableId: 'next_cue_title', name: 'Next Cue Title' },
		{ variableId: 'next_cue_duration', name: 'Next Cue Planned Duration (m:ss)' },

		// Connection
		{ variableId: 'connected', name: 'Connected (1 / 0)' },
	]
}

function pad2(n) {
	return String(n).padStart(2, '0')
}

function fmt(seconds) {
	if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return ''
	const sign = seconds < 0 ? '-' : ''
	const s = Math.abs(Math.round(seconds))
	const m = Math.floor(s / 60)
	const sec = s % 60
	return `${sign}${m}:${pad2(sec)}`
}

function parseStartedAt(startedAt) {
	if (!startedAt) return null
	// SQLite datetimes lack the trailing Z but are UTC. Tack one on if missing.
	const iso = String(startedAt).endsWith('Z') ? startedAt : startedAt + 'Z'
	const ms = new Date(iso).getTime()
	return Number.isFinite(ms) ? ms : null
}

/**
 * Build a variable-values bag from a state snapshot. The module calls this
 * once on hydration, again when state-changed fires, and once a second
 * (purely for the elapsed/remaining timers — the cue itself didn't move).
 *
 * `state` is the response body from GET /api/companion/:token/state.
 */
export function buildVariableValues(state, opts = {}) {
	const { connected = false, nowMs = Date.now() } = opts

	if (!state) {
		return {
			show_name: '',
			show_status: '',
			is_live: '0',
			cues_total: '',
			cues_completed: '',
			show_elapsed: '',
			cue_number: '',
			cue_title: '',
			cue_duration: '',
			cue_elapsed: '',
			cue_remaining: '',
			cue_over_by: '',
			cue_is_on_hold: '0',
			next_cue_number: '',
			next_cue_title: '',
			next_cue_duration: '',
			connected: connected ? '1' : '0',
		}
	}

	const { show, activeCue, nextCue, cuesTotal, cuesCompleted, isLive } = state

	// Show elapsed
	let showElapsedSec = null
	const showStartMs = parseStartedAt(show?.started_at)
	if (showStartMs !== null && (isLive || show?.status === 'completed')) {
		showElapsedSec = Math.max(0, Math.floor((nowMs - showStartMs) / 1000))
	}

	// Cue elapsed = accumulated actual + current session
	let cueElapsedSec = null
	let cueRemainingSec = null
	let cueOverBySec = null
	if (activeCue) {
		const cueStartMs = parseStartedAt(activeCue.started_at)
		const accumulated = Number(activeCue.actual_duration_seconds || 0)
		const session = cueStartMs !== null ? Math.max(0, Math.floor((nowMs - cueStartMs) / 1000)) : 0
		cueElapsedSec = accumulated + session

		const planned = Number(activeCue.duration_seconds || 0)
		if (planned > 0) {
			const remaining = planned - cueElapsedSec
			cueRemainingSec = remaining
			if (remaining < 0) cueOverBySec = -remaining
		}
	}

	return {
		show_name: show?.name ?? '',
		show_status: show?.status ?? '',
		is_live: isLive ? '1' : '0',
		cues_total: String(cuesTotal ?? ''),
		cues_completed: String(cuesCompleted ?? ''),
		show_elapsed: fmt(showElapsedSec),

		cue_number: activeCue?.cue_number ?? '',
		cue_title: activeCue?.title ?? '',
		cue_duration: activeCue?.duration_seconds ? fmt(activeCue.duration_seconds) : '',
		cue_elapsed: fmt(cueElapsedSec),
		cue_remaining: cueRemainingSec === null ? '' : fmt(cueRemainingSec),
		cue_over_by: cueOverBySec === null ? '' : fmt(cueOverBySec),
		cue_is_on_hold: activeCue?.on_hold ? '1' : '0',

		next_cue_number: nextCue?.cue_number ?? '',
		next_cue_title: nextCue?.title ?? '',
		next_cue_duration: nextCue?.duration_seconds ? fmt(nextCue.duration_seconds) : '',

		connected: connected ? '1' : '0',
	}
}
