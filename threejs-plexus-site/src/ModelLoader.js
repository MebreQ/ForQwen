import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * ModelLoader - Handles loading and parsing of GLTF models
 */
export class ModelLoader {
  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * Load a GLTF model from the given path
   * @param {string} path - Path to the GLTF file
   * @returns {Promise<THREE.Group>} - Promise resolving to the loaded model
   */
  async load(path) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          resolve(gltf.scene);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`Loading: ${percent.toFixed(2)}%`);
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Find specific nodes in the model by name
   * @param {THREE.Group} model - The loaded model
   * @param {string[]} nodeNames - Array of node names to find
   * @returns {Object} - Object with node names as keys and Three.js objects as values
   */
  findNodes(model, nodeNames) {
    const found = {};
    
    model.traverse((child) => {
      if (nodeNames.includes(child.name)) {
        found[child.name] = child;
      }
    });

    return found;
  }
}
