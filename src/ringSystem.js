
import * as THREE from 'three';

/**
 * RingSystem (Renamed behavior to FaceOverlaySystem)
 * Displays a single overlay that swaps textures.
 */
export class RingSystem {
    constructor(scene) {
        this.scene = scene;
        this.textures = [];
        this.mesh = null;
        this.overlayGroup = new THREE.Group();
        this.scene.add(this.overlayGroup);

        // Load textures (User provided 4 images)
        const loader = new THREE.TextureLoader();
        const baseImages = ['story1.png', 'story2.png', 'story3.png', 'story4.png'];

        this.textureCount = baseImages.length;

        for (let i = 0; i < this.textureCount; i++) {
            // Add a timestamp to force fresh load (Cache Busting)
            const tex = loader.load(`assets/${baseImages[i]}?v=${new Date().getTime()}`);
            tex.colorSpace = THREE.SRGBColorSpace; // Ensure correct color
            this.textures.push(tex);
        }

        this.createOverlay();
        this.overlayGroup.visible = false;

        this.lastIndex = -1;
    }

    createOverlay() {
        // Plane Geometry for the Instagram Story Aspect Ratio (9:16)
        // We want it to cover the face significant area.
        // Face width in 3D (normalized roughly) is maybe 1 unit wide?
        // Let's make it 4.6875 units wide (3.125 * 1.5) to cover "entire face" and more.
        const width = 5;
        const height = width * (16 / 9); // 9:16 aspect ratio

        const geometry = new THREE.PlaneGeometry(width, height);
        // Center the geometry so it aligns with face center naturally?
        // Usually face center is between eyes.
        // We want the "hole" in the chocolate bar to be at face center.
        // Assuming the hole is in the middle of the value.

        const material = new THREE.MeshBasicMaterial({
            map: this.textures[0], // Start with first
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false // Ensure always on top of video? No, actually we want depth sorting usually.
            // But here video is behind.
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.overlayGroup.add(this.mesh);
    }

    /**
     * Updates the overlay position and texture.
     * @param {number} index - Index of texture to show
     * @param {THREE.Matrix4} headMatrix - Transformation matrix of the head
     */
    update(index, headMatrix) {
        // Update Texture if changed
        if (this.mesh && index !== this.lastIndex && index >= 0 && index < this.textures.length) {
            this.mesh.material.map = this.textures[index];
            this.mesh.material.needsUpdate = true;
            this.lastIndex = index;
        }

        // Apply head transformation
        if (headMatrix) {
            this.overlayGroup.visible = true;
            this.overlayGroup.position.setFromMatrixPosition(headMatrix);
            this.overlayGroup.quaternion.setFromRotationMatrix(headMatrix);

            // "it should iterate the image on the face randomly... extend over entire face"
            // The overlay is attached to the head.
            // We ensure it faces forward relative to the head?
            // "Ring should always face camera" was old requirement.
            // New: "extend over entire face" implies it sticks to the face (like a mask).
            // So we generally use natural head rotation.

            // Adjust Z offset to be slightly in front to avoid clipping
            // Local Z is forward for the group?
            // Actually, we'll just move the mesh slightly forward in local space.
            this.mesh.position.z = 0.1;

        } else {
            this.overlayGroup.visible = false;
        }
    }

    highlight(index) {
        // Just scale up slightly or pulse?
        if (this.mesh) {
            // Reset scale
            this.mesh.scale.set(1.1, 1.1, 1.1);
        }
    }
}
