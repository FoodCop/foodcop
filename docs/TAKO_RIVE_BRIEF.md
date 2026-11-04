# Tako the squirrel: Rive animation brief

FUZO's food assistant, Tako, is a squirrel (the client's art: `public/images/tako/squirrel.webp`, full body with a green backpack, and `squirrel-face.webp`, the round face). We want the big Tako on the Tako page to move: wave hello, jump when tapped, think while it answers, and watch the user's finger or mouse. Please build it in **Rive** (rive.app, free editor) and send one `.riv` file.

## What to deliver

- **File:** `tako.riv`, ideally under 300 KB.
- **Artboard:** named `Tako`, square (e.g. 500 × 500), transparent background, the squirrel centred with some headroom for the jump (it is shown at 176 px on phones, up to ~240 px).
- **Look:** match the supplied art (same colours, outline style, backpack). Split it into parts so it can move: body, head, both arms, tail, eyes (open / closed), mouth (smile / open), ears, backpack.
- **State machine:** named `Tako`, starting in **Idle**.

## State machine inputs (names must match exactly)

| Input | Type | What should happen |
|---|---|---|
| `wave` | Trigger | Raises a paw and waves 2–3 times (about 1.2 s), then back to Idle. Fired when the Tako page opens. |
| `jump` | Trigger | A happy hop: squash, jump ~15% of its height, stretch, land with a small squash (about 0.8 s). Fired when the user taps Tako. |
| `happy` | Trigger | A quick delighted bounce or wiggle with an open-mouth smile (about 0.6 s). Fired when the user picks something. |
| `thinking` | Boolean | While true: looks up, paw on chin or tapping, tail swishing slowly. Back to Idle when false. Set while Tako is waiting for an answer. |
| `listening` | Boolean | While true: leans slightly forward and down, ears perked (the user is typing in the box below Tako). |
| `lookX` | Number, -100 to 100 | Head and eyes turn left (-100) to right (100). Follows the pointer. |
| `lookY` | Number, -100 to 100 | Head and eyes look up (-100) to down (100). |

## Idle (always running, loops)

- Gentle breathing (body scale ~2%).
- A blink every 3–5 seconds.
- A slow tail sway.
- An ear twitch now and then.

## Notes

- `lookX` / `lookY` should blend on top of every other state (use a blend state or a separate layer), so Tako keeps watching the user while idle, thinking or listening.
- Keep every move playful but small. It sits above a search box and three cards, so it shouldn't feel busy.
- No text or background in the file.
- Please also send the `.rev` source file so it can be edited later.
