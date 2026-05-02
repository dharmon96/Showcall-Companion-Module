# ShowCall — Companion Module Help

This module connects [Bitfocus Companion](https://bitfocus.io/companion) to a [ShowCall](https://show.darianharmon.com) server so you can run live shows from a Stream Deck.

## Getting a Connection

1. Open ShowCall and load your show.
2. **Tools → Companion / Stream Deck → Create** with an optional label (e.g. *FOH Stream Deck*).
3. Click **Copy** on the **Connection String**.
4. In Companion, add the *darianharmon: ShowCall* connection and paste into the **Connection String** field.

The module splits the pasted string into the **Server URL** and **Token** automatically. If you'd rather fill them manually, both fields are editable.

## Status Indicators

- The Companion connection list shows **OK** once the module has both fetched initial state and connected to the show's socket room.
- If the token is wrong or revoked, the connection will show **Bad Config** or **Connection Failure** with a message in the log.

## Tips

- **Show 'GO LIVE' and 'GO' on the same button**: use the *Show is Live* feedback to swap the colour and let the action call **GO / Advance Cue**. Before the show starts the action auto-goes-live; afterwards it advances normally.
- **Per-cue go-to buttons**: use *Go to Specific Cue* with the cue number, plus the *Specific Cue is Active* feedback so the button glows when that cue is up.
- **Critical-window warnings**: pair the *Active Cue is in Critical Window* feedback with the cue timer display preset for a yellow flash 10s before the cue is supposed to end.
