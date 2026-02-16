/**
 * spinLogic.js
 * Handles the logic for the "Slideshow" selector (rapid image swapping).
 */

export class SpinLogic {
    constructor(itemCount = 4) {
        this.itemCount = itemCount;

        // State
        this.state = 'IDLE'; // IDLE, SPINNING, STOPPING, STOPPED
        this.currentIndex = 0;

        // Timing
        this.timer = 0;
        this.interval = 0.1; // Seconds between swaps
        this.stopSequence = []; // List of intervals for the stopping sequence
        this.targetIndex = -1;
    }

    startSpin() {
        if (this.state === 'SPINNING') return;
        this.state = 'SPINNING';
        this.interval = 0.12; // Fast spin (120ms)
        this.timer = 0;
    }

    /**
     * Trigger the stop sequence to land on a specific index.
     * @param {number} targetIndex - The index to stop on.
     */
    triggerStop(targetIndex) {
        if (this.state !== 'SPINNING') return;

        this.state = 'STOPPING';
        this.targetIndex = targetIndex;
        this.timer = 0;

        // Create a sequence of intervals to simulate slowing down
        // We will perform X more swaps before hitting target.
        // Let's say we want to swap 5 more times:
        // Current -> Random -> Random -> Random -> Target
        // With increasing intervals: 0.1, 0.2, 0.3, 0.5, STOP

        // This is a bit complex to synchronize perfectly with "Target" if we generate random numbers.
        // Easier: Just iterate sequentially? Or purely random?
        // "Iterate the image on the face randomly"

        // We will pre-calculate the sequence of indices we will show
        // But for random, we just pick random indices.
        // The LAST one must be targetIndex.

        this.stopSequence = [
            { t: 0.15 }, // Wait 150ms
            { t: 0.25 },
            { t: 0.40 },
            { t: 0.60 },
            { t: 0.0, final: true } // Land on target
        ];
        this.stopStep = 0;
        this.interval = this.stopSequence[0].t;
    }

    update(dt) {
        if (this.state === 'IDLE' || this.state === 'STOPPED') return this.currentIndex;

        this.timer += dt;

        if (this.timer >= this.interval) {
            this.timer = 0;

            if (this.state === 'SPINNING') {
                // Pick next random index (different from current)
                let next = Math.floor(Math.random() * this.itemCount);
                while (next === this.currentIndex && this.itemCount > 1) {
                    next = Math.floor(Math.random() * this.itemCount);
                }
                this.currentIndex = next;

            } else if (this.state === 'STOPPING') {

                // If we are at the end based on previous step logic
                if (this.stopStep >= this.stopSequence.length - 1) {
                    this.currentIndex = this.targetIndex;
                    this.state = 'STOPPED';
                    return this.currentIndex;
                }

                this.stopStep++;
                const step = this.stopSequence[this.stopStep];

                if (step.final) {
                    this.currentIndex = this.targetIndex;
                    this.state = 'STOPPED';
                } else {
                    // Set new random index
                    let next = Math.floor(Math.random() * this.itemCount);
                    while (next === this.currentIndex && this.itemCount > 1) {
                        next = Math.floor(Math.random() * this.itemCount);
                    }
                    this.currentIndex = next;
                    this.interval = step.t;
                }
            }
        }

        return this.currentIndex;
    }

    reset() {
        this.state = 'IDLE';
        this.currentIndex = 0;
    }
}
