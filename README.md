# GreenGrid

GreenGrid is a polished environmental action tracker for student teams. It turns everyday habits into visible team progress with a living grid, quick action logging, challenge paths, a habit garden, transparent impact notes, green stories, resources, and project spaces.

## Highlights

- Animated weekly impact cards and liquid-style progress ring
- Interactive living grid with action details and no-shame empty states
- One-minute action logging flow backed by a small Node API
- Persistent action history, challenge updates, reactions, resources, and privacy preferences
- Challenge map, habit garden, impact explorer, stories, resources, projects, and profile controls
- Responsive layout with reduced-motion support

## Local Development

```bash
npm install
npm run dev
```

The development command starts the API and the Vite app together at `http://localhost:4173`.

## API

- `GET /api/bootstrap` returns the current dashboard state
- `POST /api/actions` records an environmental action
- `POST /api/challenges/:id/join` joins or boosts a challenge
- `POST /api/resources/:id/track` turns a resource into a logged action
- `POST /api/stories/:id/reactions` adds a story reaction
- `PATCH /api/profile/privacy` updates profile privacy controls

Local data is stored in `data/greengrid-store.json`. Set `GREEN_GRID_DB` to point at another JSON file.

## Production Build

```bash
npm run build
npm start
```
