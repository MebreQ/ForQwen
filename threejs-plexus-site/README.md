# 3D Plexus Website

A modern 3D website built with Three.js, GSAP, and Vite featuring a plexus effect animation.

## Features

- **GLTF Model Loading**: Loads external GLTF models with support for specific camera nodes
- **Plexus Effect**: Custom particle and line system that transitions into a solid mesh
- **Camera Animation**: Smooth GSAP-powered camera movement from start to end positions
- **Parallax Interaction**: Mouse-based camera parallax effect after intro animation
- **Responsive Design**: Adapts to different screen sizes

## Project Structure

```
threejs-plexus-site/
├── src/
│   ├── main.js                 # Application entry point
│   ├── SceneSetup.js           # Three.js scene initialization
│   ├── ModelLoader.js          # GLTF model loading utility
│   ├── PlexusEffect.js         # Plexus particle/line effect
│   └── AnimationController.js  # Camera animations & interactions
├── public/
│   └── assets/
│       └── model.gltf          # Place your GLTF model here (optional)
├── index.html
├── package.json
└── vite.config.js
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd threejs-plexus-site
npm install
```

### 2. Add Your GLTF Model (Optional)

Place your GLTF model file in `public/assets/model.gltf`. The model should contain two Empty/Object3D nodes named:
- `A_Camera_Home_Start` - Starting camera position
- `A_Camera_Home_End` - Ending camera position

If no model is provided, the app will use a fallback TorusKnot geometry.

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## Usage

### With Custom GLTF Model

1. Create your 3D model in Blender or similar software
2. Add two Empty objects named `A_Camera_Home_Start` and `A_Camera_Home_End`
3. Position them where you want the camera to start and end
4. Export as GLTF/GLB
5. Place in `public/assets/model.gltf`

### Default Behavior

Without a custom model, the app displays a rotating TorusKnot with:
- Plexus particle effect on load
- Camera animation from distance to close-up
- Mouse-based parallax after animation completes

## Technical Details

### Technologies Used
- **Three.js**: 3D rendering engine
- **GSAP**: Professional-grade animation library
- **Vite**: Fast build tool and dev server

### Key Features

#### Plexus Effect
- Creates points from mesh vertices
- Generates lines between nearby points
- Smoothly transitions to solid mesh during camera animation

#### Camera Animation
- 3-second duration with power2.inOut easing
- Animates both position and rotation
- Synchronized with plexus transition

#### Parallax Effect
- Enabled after intro animation completes
- Uses linear interpolation (lerp) for smooth movement
- Responds to mouse position with subtle camera offset

## Customization

### Adjust Camera Positions
Edit default values in `AnimationController.js`:
```javascript
this.startPosition = new THREE.Vector3(0, 0, 15);
this.endPosition = new THREE.Vector3(0, 0, 8);
```

### Modify Plexus Settings
Edit in `PlexusEffect.js`:
```javascript
const maxDistance = 2.5; // Connection distance
const sampleRate = Math.max(1, Math.floor(pointCount / 500)); // Point density
```

### Change Animation Duration
Edit in `AnimationController.js`:
```javascript
duration: 3, // Animation duration in seconds
```

## License

MIT
