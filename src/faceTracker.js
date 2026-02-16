
export class FaceTracker {
    constructor(videoElement) {
        this.video = videoElement;
        this.onFaceFound = null;
        this.onFaceLost = null;
        this.isRunning = false;

        // Check global FaceMesh
        if (!window.FaceMesh) {
            console.error("MediaPipe FaceMesh not loaded. Check network or scripts.");
            alert("Failed to load Face Tracking library.");
            return;
        }

        this.faceMesh = new window.FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults(this.onResults.bind(this));
    }

    async start(onStatusChange) {
        if (this.isRunning) return;
        this.isRunning = true;

        if (onStatusChange) onStatusChange("Requesting Camera Access...");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            this.video.srcObject = stream;

            if (onStatusChange) onStatusChange("Starting Video Stream...");

            await new Promise((resolve) => {
                const onLoaded = () => {
                    this.video.play().then(() => resolve()).catch(e => {
                        console.error("Play error", e);
                        resolve(); // Try to continue anyway
                    });
                };

                if (this.video.readyState >= 1) {
                    onLoaded();
                } else {
                    this.video.onloadedmetadata = onLoaded;
                    // Fallback cleanup if event never fires (2s timeout)
                    setTimeout(() => {
                        if (this.video.paused) onLoaded();
                    }, 2000);
                }
            });

            if (onStatusChange) onStatusChange("Initializing AI Models...");
            this.processLoop();

        } catch (e) {
            console.error("Camera Error:", e);
            alert("Could not access camera. Please ensure you have given permission and are using a secure connection (HTTPS or localhost).");
            throw e; // Propagate error
        }
    }

    async processLoop() {
        if (!this.isRunning) return;

        if (this.video.readyState >= 2) {
            await this.faceMesh.send({ image: this.video });
        }

        requestAnimationFrame(this.processLoop.bind(this));
    }

    onResults(results) {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            if (this.onFaceFound) this.onFaceFound(landmarks);
        } else {
            if (this.onFaceLost) this.onFaceLost();
        }
    }
}
