# Evil Eye on Mars

*Earth's evil-eye bead, Lake Meke, watching over Martian life.*

Evil Eye on Mars is an interactive 3D decision-support map that helps mission planners and astronauts choose where to land and explore on Mars. Every candidate site gets two scores:

- **Terra**: landing and navigation safety (slope, rock abundance, elevation)
- **Vita**: astrobiological discovery potential

Vita is anchored to **Lake Meke** (Konya, Türkiye), a salty volcanic maar lake known as "Earth's evil-eye bead". We compare each Mars site with Meke to estimate how well it could preserve signs of past life.

Built for the **NASA Space Apps Challenge 2026**, challenge: *Interplanetary Survival Guide: Martian Map*.

## How it was built

- The user interface prototype was prepared before the hackathon with AI assistance. Our mentor approved using it as a prototype.
- During the hackathon we added: the Lake Meke analog model, real data with sources, and the updated scoring.

## Data

- NASA MGS MOLA elevation (MEGDR, 16 pixels/degree)
- NASA/USGS Viking MDIM 2.1 colour mosaic
- Landsat imagery of Lake Meke (NASA/USGS)
- Published studies on Lake Meke and Mars landing sites (full list in the project page)

## Run it

```bash
npm install
npm run dev       # opens the app
npm run dogrula   # runs the calculation tests
```

## Team

Ayşegül, Asude, Hasan, Oğuz, Kayra, Umut
