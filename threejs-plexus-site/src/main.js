import * as THREE from 'three';
import { SceneSetup } from './SceneSetup.js';
import { ModelLoader } from './ModelLoader.js';
import { PlexusEffect } from './PlexusEffect.js';
import { AnimationController } from './AnimationController.js';

/**
 * Main application class
 */
class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.loadingElement = document.getElementById('loading');
    
    this.sceneSetup = null;
    this.modelLoader = null;
    this.animationController = null;
    
    this.model = null;
    this.plexusEffect = null;
    this.isLoaded = false;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Setup scene
      this.sceneSetup = new SceneSetup(this.container);
      
      // Setup model loader
      this.modelLoader = new ModelLoader();
      
      // Load model and setup scene
      await this.loadScene();
      
      // Setup animation controller
      this.animationController = new AnimationController(
        this.sceneSetup.scene,
        this.sceneSetup.camera
      );
      
      // Start render loop
      this.animate();
      
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.loadingElement.textContent = 'Error loading scene';
    }
  }

  /**
   * Load the 3D model and setup plexus effect
   */
  async loadScene() {
    try {
      // Try to load external GLTF model
      let model;
      let nodes = {};
      
      try {
        model = await this.modelLoader.load('/assets/model.gltf');
        
        // Find camera nodes
        nodes = this.modelLoader.findNodes(model, [
          'A_Camera_Home_Start',
          'A_Camera_Home_End'
        ]);
        
        // Setup camera positions from nodes
        if (nodes['A_Camera_Home_Start'] && nodes['A_Camera_Home_End']) {
          this.animationController = new AnimationController(
            this.sceneSetup.scene,
            this.sceneSetup.camera
          );
          this.animationController.setCameraPositions(
            nodes['A_Camera_Home_Start'],
            nodes['A_Camera_Home_End']
          );
        }
        
      } catch (loadError) {
        console.warn('Could not load external model, using fallback geometry');
        
        // Create fallback geometry (torus knot for demonstration)
        const geometry = new THREE.TorusKnotGeometry(2, 0.6, 128, 32);
        const material = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          metalness: 0.7,
          roughness: 0.2,
          transparent: true,
          opacity: 0
        });
        
        model = new THREE.Group();
        const mesh = new THREE.Mesh(geometry, material);
        model.add(mesh);
        
        // Setup default camera positions
        this.animationController = new AnimationController(
          this.sceneSetup.scene,
          this.sceneSetup.camera
        );
      }
      
      // Add model to scene
      this.sceneSetup.scene.add(model);
      this.model = model;
      
      // Create plexus effect for the first mesh found
      model.traverse((child) => {
        if (child.isMesh && !this.plexusEffect) {
          this.plexusEffect = new PlexusEffect(child.geometry, child.material);
          this.plexusEffect.addToGroup(model);
          
          // Link plexus to animation controller
          if (this.animationController) {
            this.animationController.setPlexusEffect(this.plexusEffect);
          }
        }
      });
      
      // Hide loading indicator
      this.hideLoading();
      this.isLoaded = true;
      
      // Play intro animation
      if (this.animationController) {
        this.animationController.playIntro(() => {
          console.log('Intro animation complete');
        });
      }
      
    } catch (error) {
      console.error('Failed to load scene:', error);
      throw error;
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.classList.add('hidden');
      setTimeout(() => {
        this.loadingElement.style.display = 'none';
      }, 500);
    }
  }

  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.sceneSetup.getDelta();
    
    // Update animations
    if (this.animationController) {
      this.animationController.update(delta);
    }
    
    // Rotate model slightly for visual interest
    if (this.model) {
      this.model.rotation.y += delta * 0.1;
    }
    
    // Render scene
    this.sceneSetup.render();
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.plexusEffect) {
      this.plexusEffect.dispose();
    }
    
    if (this.sceneSetup) {
      this.sceneSetup.dispose();
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
