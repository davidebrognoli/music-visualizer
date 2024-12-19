# Music Visualizer

This is a demo project developed for the [CodicePlastico](https://github.com/CodicePlastico) Winter Company Meeting 2024 Workshop. The main goal is to explore the potential of the Web Audio API by creating an interactive music visualizer.

## Features

- Interactive visualization of audio files.
- Supports local MP3 file uploads.
- Animations synchronized with the audio playback.

## Technologies Used

- **HTML**, **CSS**, and **Vanilla JavaScript** for the frontend.
- **Web Audio API** for audio analysis and visualization.
- **Canvas API** for rendering visual elements.
- **jsmediatags** for extracting media tags from audio files.
- **Browser Sync** for local development server.

## Prerequisites

To run this project locally, you need:

- [Node.js](https://nodejs.org/) installed on your system.
- A modern web browser (e.g., Chrome, Firefox, Edge).

## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:davidebrognoli/music-visualizer.git
   ```

2. Navigate to the project directory:
   ```bash
   cd music-visualizer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. Upload a local MP3 file and enjoy the visualization.

## Project Structure

```
public/
├── index.html   # Main HTML file
├── style.css    # Styling for the visualizer
├── script.js    # JavaScript logic for visualization
```

## Known Issues

- This is a demo project and has not been extensively tested for all edge cases.
- The visualizer might not work as expected with certain audio formats or very large files.

## Contributing

Contributions are welcome! If you find a bug or have a suggestion, please open an issue on [GitHub](https://github.com/davidebrognoli/music-visualizer/issues).

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for more details.

---

Developed with ❤️ by [Davide Brognoli](https://github.com/davidebrognoli).