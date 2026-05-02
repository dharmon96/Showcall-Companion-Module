# companion-module-mantaglow-showcall

A [Bitfocus Companion](https://bitfocus.io/companion) module for [ShowCall](https://show.darianharmon.com) — drive your live run-of-show from a Stream Deck.

## What it does

- **Trigger cues** from physical buttons: GO / Back / Go-to-specific-cue / Go Live / Stop.
- **Reset the active cue timer** for everyone watching, in one tap.
- **Send broadcast banners** to every connected viewer (persistent, timed, or flashing).
- **Live feedback** on the buttons:
  - Glow when the show is live.
  - Yellow when the active cue is in its critical-window.
  - Red when the active cue is over time.
  - Yellow when the active cue is on hold.
  - Highlight a button when its cue is the active one.
- **Variables** for cue number, title, planned duration, elapsed, remaining, next cue, show elapsed, etc. — drop them into any button label.

## Install

### From the Companion Module Store (preferred, once published)

> Pending submission to the Companion module store. Until then, install manually.

### Manual install (developer / sideload)

1. Download the latest `.tgz` from [Releases](https://github.com/dharmon96/Showcall-Companion-Module/releases).
2. In Companion, open **Settings → Modules** and enable **Developer mode**.
3. Click **Import module** and select the `.tgz`.

## Connect

1. In ShowCall, open **Tools → Companion / Stream Deck**.
2. Click **Create** to mint a new Companion link (this is a `showcaller`-level share token scoped to the show).
3. Copy the **Connection URL**.
4. In Companion, add a new **Mantaglow: ShowCall** connection and paste the URL into the single **Connection URL** field — that's the only thing it asks for.

You can revoke a Companion link from the same dialog at any time without affecting other share links.

## Actions

| Action | Description |
|---|---|
| GO / Advance Cue | Advance to the next cue. Auto-goes-live if no cue is active yet. |
| Back / Previous Cue | Step backwards. |
| Go Live | Mark show as live and activate first cue. |
| Stop Show | Mark show as completed. |
| Go to Specific Cue | Jump directly to a cue by its `Cue #`. |
| Reset Active Cue Timer | Reset elapsed to 0:00 for everyone. |
| Toggle Hold on Active Cue | Pause/resume the current cue. |
| Send Broadcast Banner | Push a banner (persistent / timed / flash) to all viewers. |
| Clear Broadcast Banner | Dismiss the active banner. |

## Variables

Available as `$(mantaglow-showcall:<id>)` in any button text.

**Show:**
- `show_name`, `show_status`, `is_live`, `cues_total`, `cues_completed`, `show_elapsed`

**Active cue:**
- `cue_number`, `cue_title`, `cue_duration`, `cue_elapsed`, `cue_remaining`, `cue_over_by`, `cue_is_on_hold`

**Next cue:**
- `next_cue_number`, `next_cue_title`, `next_cue_duration`

**Connection:**
- `connected`

## Feedbacks

- **Show is Live**
- **Specific Cue is Active** (per-cue, parameterized by Cue Number)
- **Active Cue is Over Time**
- **Active Cue is in Critical Window** (parameterized threshold seconds)
- **Active Cue is On Hold**
- **Broadcast Banner Visible**
- **Connected to ShowCall**

## Presets

The module ships with a **Show Control** preset category — drag GO / Back / Go Live / Stop / Reset Timer / Hold onto your Stream Deck for an instant showcaller layout. Plus **Display** (current cue, cue timer, next cue) and **Broadcast** presets.

## Development

```bash
npm install
npm run dev      # live-reload against a running Companion instance
npm run package  # produce a distributable zip
```

Connects to ShowCall via:

- HTTPS: `POST /api/companion/:token/<action>` for trigger actions and `GET /api/companion/:token/state` for hydration / poll fallback.
- Socket.IO: joins the show's room with `query.viewer=true` so it listens to `cue:advance`, `cue:updated`, `time:sync`, `broadcast:message`, etc.

## License

MIT — see [LICENSE](./LICENSE).
