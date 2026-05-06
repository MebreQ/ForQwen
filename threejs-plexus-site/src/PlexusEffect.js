import * as THREE from 'three';

/**
 * PlexusShader - Custom shader for the plexus effect
 * Creates connecting lines between nearby vertices that fade into solid mesh
 */
export class PlexusEffect {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.originalMaterial = material;
    this.points = null;
    this.lines = null;
    this.mesh = null;
    this.isActive = true;
    
    this.init();
  }

  /**
   * Initialize the plexus effect with points and lines
   */
  init() {
    // Create points from geometry vertices
    const positions = this.geometry.attributes.position.array;
    const pointCount = positions.length / 3;
    
    // Create Points material with custom shader
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true
    });

    // Create Points object
    this.points = new THREE.Points(this.geometry, pointsMaterial);

    // Create lines connecting nearby points
    this.lines = this.createPlexusLines(positions, pointCount);

    // Create the solid mesh (initially hidden)
    this.mesh = new THREE.Mesh(this.geometry, this.originalMaterial);
    this.mesh.visible = false;
  }

  /**
   * Create lines connecting nearby vertices (plexus effect)
   * @param {Float32Array} positions - Vertex positions
   * @param {number} pointCount - Number of points
   * @returns {THREE.LineSegments} - Line segments object
   */
  createPlexusLines(positions, pointCount) {
    const linePositions = [];
    const maxDistance = 2.5; // Maximum distance to connect points
    
    // Sample points to avoid too many connections (performance)
    const sampleRate = Math.max(1, Math.floor(pointCount / 500));
    
    for (let i = 0; i < pointCount; i += sampleRate) {
      const x1 = positions[i * 3];
      const y1 = positions[i * 3 + 1];
      const z1 = positions[i * 3 + 2];
      
      for (let j = i + sampleRate; j < pointCount; j += sampleRate) {
        const x2 = positions[j * 3];
        const y2 = positions[j * 3 + 1];
        const z2 = positions[j * 3 + 2];
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < maxDistance) {
          linePositions.push(x1, y1, z1, x2, y2, z2);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      linewidth: 1
    });

    return new THREE.LineSegments(lineGeometry, lineMaterial);
  }

  /**
   * Add all plexus elements to a group
   * @param {THREE.Group} group - Group to add elements to
   */
  addToGroup(group) {
    if (this.points) group.add(this.points);
    if (this.lines) group.add(this.lines);
    if (this.mesh) group.add(this.mesh);
  }

  /**
   * Remove all plexus elements from a group
   * @param {THREE.Group} group - Group to remove elements from
   */
  removeFromGroup(group) {
    if (this.points) group.remove(this.points);
    if (this.lines) group.remove(this.lines);
    if (this.mesh) group.remove(this.mesh);
  }

  /**
   * Transition from plexus to solid mesh
   * @param {number} progress - Progress value from 0 to 1
   */
  transition(progress) {
    if (!this.isActive) return;

    const pointsOpacity = 1 - progress;
    const linesOpacity = 0.6 * (1 - progress);

    if (this.points) {
      this.points.material.opacity = pointsOpacity;
    }

    if (this.lines) {
      this.lines.material.opacity = linesOpacity;
    }

    if (this.mesh && progress > 0.7) {
      this.mesh.visible = true;
      this.mesh.material.opacity = (progress - 0.7) / 0.3;
    }

    // Deactivate when fully transitioned
    if (progress >= 1) {
      this.isActive = false;
      if (this.points) this.points.visible = false;
      if (this.lines) this.lines.visible = false;
      if (this.mesh) {
        this.mesh.visible = true;
        this.mesh.material.opacity = 1;
      }
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.points) {
      this.points.material.dispose();
    }
    if (this.lines) {
      this.lines.geometry.dispose();
      this.lines.material.dispose();
    }
  }
}
