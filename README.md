# Hessian Matrix

Interactive Three.js visualizer for building intuition about the Hessian matrix, second-order derivatives, eigenvalues, and saddle points.

Live demo: https://jason9075.github.io/Hessian-Matrix/

Repository: https://github.com/jason9075/Hessian-Matrix

## Scenes

- `Terrain Scanner`: hover surfaces to inspect local position, gradient, tangent plane, and Hessian.
- `Shape Shifter`: edit `fxx`, `fyy`, and `fxy` to see how the quadratic surface changes.
- `Curvature Ellipse`: view eigenvectors and the level curve as an ellipse or hyperbola.
- `Saddle Point`: watch why mixed Hessian signs create stable and unstable directions.

## Local Development

This project is a static site served directly from the repository root.

```sh
nix develop
just dev
```

Useful commands:

```sh
just dev      # Start live-server at http://localhost:8080
just refresh  # Touch index.html to force browser reload
just check    # Verify live-server and just are installed
```

## Project Structure

```text
index.html    # App shell, styles, import map, sidebar UI
src/main.js   # Shared renderer, scene switching, modal wiring
src/*.js      # Scene modules and shared math/render helpers
Justfile      # Local development commands
flake.nix     # Nix dev shell with live-server and just
```

## Tech Stack

- Three.js
- Native ES modules
- `live-server`
- Nix + `just`
