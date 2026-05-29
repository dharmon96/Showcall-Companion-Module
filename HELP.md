# ShowCall — Companion Module Help

This module connects [Bitfocus Companion](https://bitfocus.io/companion) to a [ShowCall](https://show.darianharmon.com) server so you can run live shows from a Stream Deck.

## Getting a Connection

1. Open ShowCall and load your show.
2. **Tools → Companion / Stream Deck → Create** with an optional label (e.g. *FOH Stream Deck*).
3. Click **Copy** on the **Connection URL**.
4. In Companion, add the *Mantaglow: ShowCall* connection and paste into the **Connection URL** field.

The module needs only that single URL — it parses out the server origin and the token internally.

## Status Indicators

- The Companion connection list shows **OK** once the module has both fetched initial state and connected to the show's socket room.
- If the token is wrong or revoked, the connection will show **Bad Config** or **Connection Failure** with a message in the log.

## Tips

- **Show 'GO LIVE' and 'GO' on the same button**: use the *Show is Live* feedback to swap the colour and let the action call **GO / Advance Cue**. Before the show starts the action auto-goes-live; afterwards it advances normally.
- **Per-cue go-to buttons**: use *Go to Specific Cue* with the cue number, plus the *Specific Cue is Active* feedback so the button glows when that cue is up.
- **Critical-window warnings**: pair the *Active Cue is in Critical Window* feedback with the cue timer display preset for a yellow flash 10s before the cue is supposed to end.

## Triggering other Companion modules from a ShowCall cue

The module surfaces enough state via *variables* and *feedbacks* that Companion's built-in **Triggers** can fire actions in any other module whenever a specific ShowCall cue activates.

### Example: when ShowCall cue 2 fires, trigger Disguise cue 11

1. Open Companion → **Triggers** tab → *Add Trigger*.
2. **Event** → `Feedback condition becomes true`.
3. **Feedback** → choose `Mantaglow: ShowCall → Specific Cue is Active`, set **Cue Number** = `2`.
4. **Actions** → add the action from the other module (e.g. `Disguise → Trigger Cue 11`, or `Resolume Arena → Trigger Column`).

The trigger fires once, on the transition from "cue 2 is not active" → "cue 2 is active". Add as many cue → action mappings as you need.

### Alternative: trigger on cue number change

If you'd rather use the variable directly:

1. Add Trigger → **Event** → `Variable changes`.
2. **Variable** → `mantaglow-showcall:cue_number`.
3. Add conditions (e.g. `equals "2"`) under *When*.
4. Add the downstream action under *Actions*.

This pattern works for any Companion module — disguise, OBS, Resolume Arena/Avenue, ATEM, OSC Generic, etc. The ShowCall module never has to know which modules you've chained to.
