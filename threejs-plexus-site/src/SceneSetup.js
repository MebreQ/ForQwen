import * as THREE from 'three';

/**
 * SceneSetup - Handles Three.js scene initialization and configuration
 */
export class SceneSetup {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    
    this.init();
  }

  /**
   * Initialize the Three.js scene, camera, and renderer
   */
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);
    this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.02);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 10);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    // Add renderer to DOM
    this.container.appendChild(this.renderer.domElement);

    // Create clock for delta time
    this.clock = new THREE.Clock();

    // Setup lighting
    this.setupLights();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  /**
   * Setup scene lighting
   */
  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Directional light (main light source)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Point lights for visual interest
    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 10);
    pointLight1.position.set(-3, 2, 3);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 10);
    pointLight2.position.set(3, -2, 3);
    this.scene.add(pointLight2);
  }

  /**
   * Handle window resize events
   */
  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Get the delta time from the clock
   * @returns {number} - Delta time in seconds
   */
  getDelta() {
    return this.clock.getDelta();
  }

  /**
   * Render the scene
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
