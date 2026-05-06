import * as THREE from 'three';
import gsap from 'gsap';

/**
 * AnimationController - Handles camera animations and interactions
 */
export class AnimationController {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Camera state
    this.startPosition = new THREE.Vector3(0, 0, 15);
    this.startRotation = new THREE.Euler(0, 0, 0);
    this.endPosition = new THREE.Vector3(0, 0, 8);
    this.endRotation = new THREE.Euler(0, 0, 0);
    
    // Parallax state
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.isParallaxEnabled = false;
    
    // Animation state
    this.introComplete = false;
    this.plexusEffect = null;
    
    this.init();
  }

  /**
   * Initialize animation controller
   */
  init() {
    // Setup mouse movement listener
    window.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
  }

  /**
   * Set camera positions from GLTF nodes
   * @param {THREE.Object3D} startNode - Start position node
   * @param {THREE.Object3D} endNode - End position node
   */
  setCameraPositions(startNode, endNode) {
    if (startNode) {
      this.startPosition.copy(startNode.position);
      this.startRotation.copy(startNode.rotation);
    }
    
    if (endNode) {
      this.endPosition.copy(endNode.position);
      this.endRotation.copy(endNode.rotation);
    }
  }

  /**
   * Set the plexus effect instance
   * @param {PlexusEffect} plexusEffect - Plexus effect instance
   */
  setPlexusEffect(plexusEffect) {
    this.plexusEffect = plexusEffect;
  }

  /**
   * Handle mouse movement for parallax effect
   * @param {MouseEvent} event - Mouse event
   */
  onMouseMove(event) {
    // Normalize mouse position to -1 to 1 range
    this.targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * Play the intro animation sequence
   * @param {Function} onComplete - Callback when animation completes
   */
  playIntro(onComplete) {
    // Set initial camera position
    this.camera.position.copy(this.startPosition);
    this.camera.rotation.copy(this.startRotation);

    // Create GSAP timeline
    const timeline = gsap.timeline({
      onComplete: () => {
        this.introComplete = true;
        this.isParallaxEnabled = true;
        if (onComplete) onComplete();
      }
    });

    // Animate camera position
    timeline.to(this.camera.position, {
      x: this.endPosition.x,
      y: this.endPosition.y,
      z: this.endPosition.z,
      duration: 3,
      ease: 'power2.inOut'
    }, 0);

    // Animate camera rotation
    timeline.to(this.camera.rotation, {
      x: this.endRotation.x,
      y: this.endRotation.y,
      z: this.endRotation.z,
      duration: 3,
      ease: 'power2.inOut'
    }, 0);

    // Animate plexus transition (if available)
    if (this.plexusEffect) {
      timeline.to({}, {
        duration: 3,
        ease: 'power2.inOut',
        onUpdate: () => {
          const progress = timeline.progress();
          this.plexusEffect.transition(progress);
        }
      }, 0);
    }

    return timeline;
  }

  /**
   * Update parallax effect (called in render loop)
   * @param {number} delta - Delta time
   */
  updateParallax(delta) {
    if (!this.isParallaxEnabled || !this.introComplete) return;

    // Smoothly interpolate mouse values using lerp
    const lerpFactor = 5 * delta;
    this.mouseX += (this.targetMouseX - this.mouseX) * lerpFactor;
    this.mouseY += (this.targetMouseY - this.mouseY) * lerpFactor;

    // Apply subtle camera offset based on mouse position
    const parallaxIntensity = 0.5;
    const targetX = this.endPosition.x + this.mouseX * parallaxIntensity;
    const targetY = this.endPosition.y + this.mouseY * parallaxIntensity;
    
    // Smoothly interpolate camera position
    this.camera.position.x += (targetX - this.camera.position.x) * lerpFactor;
    this.camera.position.y += (targetY - this.camera.position.y) * lerpFactor;

    // Subtle rotation based on mouse
    const rotationIntensity = 0.1;
    const targetRotX = this.endRotation.x + this.mouseY * rotationIntensity;
    const targetRotY = this.endRotation.y - this.mouseX * rotationIntensity;
    
    this.camera.rotation.x += (targetRotX - this.camera.rotation.x) * lerpFactor;
    this.camera.rotation.y += (targetRotY - this.camera.rotation.y) * lerpFactor;
  }

  /**
   * Update animation state (called in render loop)
   * @param {number} delta - Delta time
   */
  update(delta) {
    this.updateParallax(delta);
  }

  /**
   * Check if intro animation is complete
   * @returns {boolean} - True if intro is complete
   */
  isIntroComplete() {
    return this.introComplete;
  }
}
