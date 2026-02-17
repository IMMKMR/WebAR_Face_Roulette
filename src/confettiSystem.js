
import * as THREE from 'three';

export class ConfettiSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.geometry = new THREE.PlaneGeometry(3, 3); // Much larger particles

        // Load Confetti Textures
        this.textures = [];
        const loader = new THREE.TextureLoader();
        const version = new Date().getTime(); // Cache buster
        for (let i = 1; i <= 4; i++) {
            this.textures.push(loader.load(`assets/confetti${i}.png?v=${version}`));
        }
    }

    /**
     * Trigger a confetti burst for a specific index.
     * @param {number} index - Index of the result (0-3).
     * @param {THREE.Matrix4} originMatrix - The head matrix.
     */
    burst(index, originMatrix) {
        if (!originMatrix) return;

        const texture = this.textures[index] || this.textures[0]; // Fallback

        const count = 50; // slightly fewer particles if they are bigger to avoid clutter? No, keep it celebratory.
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        originMatrix.decompose(position, quaternion, scale);

        // Base material for this burst
        const baseMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: true, // Enable depth test for occlusion
            depthWrite: false // Don't write to depth, just test against occluder
        });

        for (let i = 0; i < count; i++) {
            // Clone for individual opacity
            const material = baseMaterial.clone();
            const mesh = new THREE.Mesh(this.geometry, material);

            // Start at the center of the head
            mesh.position.copy(position);

            // Random spread in initial position
            // Spread more in X/Y plane
            mesh.position.x += (Math.random() - 0.5) * 2.0;
            mesh.position.y += (Math.random() - 0.5) * 2.0;
            mesh.position.z += -0.5 - (Math.random() * 0.5); // Start behind (Z < 0)

            // Random velocity - EXPLOSIVE
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 15, // Wider spread
                (Math.random() * 8) + 4,    // Slightly reduced upward burst for heavy bars
                -(Math.random() * 5) - 2    // Always backward (negative Z)
            );

            // Random rotation speed
            const rotSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            );

            // Life - Longer (3-5 seconds)
            const life = 5.0 + Math.random() * 2.0;

            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                rotSpeed: rotSpeed,
                life: life,
                maxLife: life
            });

            this.scene.add(mesh);
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.life -= dt;

            if (p.life <= 0) {
                // Remove
                this.scene.remove(p.mesh);
                if (p.mesh.material) p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            // Physics
            p.mesh.position.addScaledVector(p.velocity, dt);
            p.velocity.y -= 9.8 * dt; // Gravity
            p.velocity.x *= 0.98; // Less air drag for heavy bars
            p.velocity.z *= 0.98;

            p.mesh.rotation.x += p.rotSpeed.x * dt;
            p.mesh.rotation.y += p.rotSpeed.y * dt;
            p.mesh.rotation.z += p.rotSpeed.z * dt;

            // Fade out - Start fading at 2.0s
            // Smooth easing
            if (p.life < 2.0) {
                p.mesh.material.opacity = p.life / 2.0;
            }
        }
    }
}
