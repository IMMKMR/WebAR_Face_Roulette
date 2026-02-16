# WebAR Face Roulette

A browser-based Augmented Reality face filter that places a spinning roulette of images around your head.

## 🚀 Features
- **Face Tracking**: Uses MediaPipe Face Mesh for robust head tracking.
- **3D Graphics**: Three.js rendering with custom spinning physics.
- **Roulette Logic**: Increasing speed, easing deceleration, random selection.
- **Mobile Optimized**: Works on iOS/Android browsers.
- **Privacy First**: All processing is done locally in the browser.

## 🛠 Setup & Run
Since this project uses ES Modules and camera access, it requires a local server.

### Option 1: Using Node.js (Recommended)
1. Navigate to the project folder:
   ```sh
   cd WebAR_Face_Roulette
   ```
2. Run a local server:
   ```sh
   npx serve .
   ```
3. Open `http://localhost:3000` in your browser.
   (Note: Camera access requires `localhost` or `https`)

### Option 2: Using Python
1. From the project root:
   ```sh
   python -m http.server
   ```
2. Open `http://localhost:8000`

## 📱 Mobile Testing
To test on mobile, you need HTTPS or port forwarding (since camera is blocked on insecure HTTP over LAN).
- Use **ngrok**: `ngrok http 3000`
- Open the generated https URL on your phone.

## 📂 Structure
- `index.html`: Main HTML entry point.
- `style.css`: Main stylesheet.
- `src/`: JavaScript modules (FaceTracker, RingSystem, etc).
- `assets/`: Image assets (SVGs).
