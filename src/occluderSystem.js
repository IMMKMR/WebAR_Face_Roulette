
import * as THREE from 'three';

export class OccluderSystem {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.createOccluder();
    }

    createOccluder() {
        // Approximate head shape: A vertical oval/cylinder
        // Face is roughly 15-20cm wide.
        // In our normalized coordinate system (where width~=visibleWidth at z=0), we need to estimate size.
        // In main.js, we adjust scale based on face landmarks, but here we attach to the matrix.
        // The matrix in main.js is derived from landmarks.
        // Usually, the "Head" unit scale might be small or large depending on how it's calculated.
        // In main.js: currentHeadMatrix.compose(position, q, new THREE.Vector3(1, 1, 1));
        // So scale is 1. The position is in world units.
        // The visible width at Z=0 depends on FOV.

        // Let's make a generic head shape geometry.
        // Radius ~ 0.8 units (tweakable), Height ~ 2.0 units
        // We can just use a cylinder or a sphere with non-uniform scale.
        const geometry = new THREE.CylinderGeometry(0.7, 0.7, 2.0, 32);

        // Use a basic material with colorWrite: false to effectively punch a hole in the depth buffer
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Debug color (won't be seen)
            colorWrite: false,
            side: THREE.DoubleSide // Occlude from both sides
        });

        this.mesh = new THREE.Mesh(geometry, material);

        // Rotate to match head orientation (Cylinder is Y-up, Head matrix is likely Z-forward Y-up?)
        // If main.js sets orientation correctly, we might need to rotate the cylinder geometry to align.
        // Typically heads are Y-up. Cylinder is Y-up.

        this.mesh.renderOrder = 0; // Render first to write to depth buffer
        this.scene.add(this.mesh);
    }

    update(headMatrix) {
        if (!headMatrix) {
            this.mesh.visible = false;
            return;
        }

        this.mesh.visible = true;

        // Apply transformation
        this.mesh.position.setFromMatrixPosition(headMatrix);
        this.mesh.quaternion.setFromRotationMatrix(headMatrix);
        this.mesh.scale.setFromMatrixScale(headMatrix);

        // Adjust scale/offset manually if needed
        // The head matrix is centered between eyes (landmark 168).
        // Cylinder origin is center.
        // We might want to move it back slightly in Z to represent the bulk of the head behind the eyes?
        // Or down slightly?
        // Let's push it slightly back in Z (local space) to cover the head volume.
        this.mesh.translateZ(-0.5);
    }
}
