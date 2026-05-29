# Changelog

All notable changes to the Mantaglow ShowCall Companion module.

## [0.3.2] — 2026-05-01

### Documentation
- `HELP.md` now documents how to **chain to other Companion modules** — use the `Specific Cue is Active` feedback (or the `cue_number` variable) as the source of a Companion *Trigger* and pair it with actions from any other module (Disguise, Resolume Arena, OBS, OSC Generic, etc.). No code change required to fire cross-module callbacks on a ShowCall cue.

## [0.3.1] — 2026-05-01

### Fixed
- `broadcast_message` action now acts as a **smart toggle** (clear when its text is already broadcasting, otherwise send), so pre-0.3.0 buttons toggle correctly without needing a preset re-drop.
- Module-side **auto-clear timer** for timed and `screen-flash` broadcasts — the `broadcast_matches` feedback now drops the moment the on-screen banner naturally fades, instead of staying lit indefinitely.

## [0.3.0] — 2026-05-01

### Added
- New action **`broadcast_toggle`** — alias of `broadcast_message`'s toggle behaviour, kept for users who explicitly chose it.
- New feedback **`cue_warning`** — fires when active cue's elapsed crosses N% of duration. Layer with `cue_critical` + `cue_over_time` for a four-step color escalation (green → amber → yellow → red).
- New feedback **`broadcast_matches`** — true when the active broadcast banner text equals the button's text.
- New variable **`cue_position`** — 1-indexed position of the active cue within the advanceable order, paired with a new `Cue Position (10/16)` preset.
- New variables **`broadcast_active`**, **`broadcast_text`**, **`broadcast_color`**.
- Broadcast options now expose **`screen-flash`** mode (fullscreen color pulses) and **`targetDeptIds`** (comma-separated dept IDs — blank broadcasts to everyone).
- New presets: **Cue Timer (4-step color escalation)**, **Cue Position (10/16)**, **ALERT** quick-broadcast demoing screen-flash.
- Quick-broadcast presets now use `broadcast_toggle` + `broadcast_matches` feedback so the button glows while its message is live and clears on a second press.

## [0.2.0] — 2026-05-01

### Changed (breaking)
- **Renamed module** to `mantaglow-showcall` (manufacturer **Mantaglow**, product **ShowCall**). Old `darianharmon-showcall` is in `legacyIds` so existing imports migrate cleanly.
- **Collapsed config to a single `Connection URL` field** — the module parses the URL's origin as the server and `?token=` as the showcaller token. Legacy pipe format (`url|token`) and bare tokens still accepted.

## [0.1.1] — 2026-05-01

### Fixed
- Properly packaged as a Companion-style `.tgz` (esbuild-bundled `main.js` inside a `pkg/` root) instead of a raw source `.zip`.
- Required `legacyIds` field added to the manifest so Companion's manifest validator accepts the module.
- Bumped `@companion-module/base` to `~1.12.0` to match the `@companion-module/tools` peer requirement.

## [0.1.0] — 2026-05-01

### Added
- Initial release.
- Actions: `advance`, `back`, `go_live`, `stop`, `go_to_cue`, `reset_active_cue_timer`, `toggle_hold_active`, `broadcast_message`, `clear_broadcast`.
- Variables for the show, active cue, next cue, and connection state.
- Feedbacks: `is_live`, `cue_active`, `cue_over_time`, `cue_critical`, `cue_on_hold`, `broadcast_active`, `connected`.
- Preset categories: Show Control, Display, Cue Navigation, Quick Broadcasts, Combo.
- Connects via HTTPS to `/api/companion/:token/*` and Socket.IO for live state.
