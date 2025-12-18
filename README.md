# CSUN Map Quiz Game

A location-based quiz game using Google Maps API where users guess the locations of buildings on the CSUN campus.

## Features

- **Interactive Map Quiz**: Double-click on the map to guess locations
- **Visual Feedback**: Green markers for correct answers, red for incorrect
- **Score Tracking**: Tracks correct and incorrect answers
- **Timer**: Records how fast you complete the game
- **High Score**: Saves your best time in localStorage
- **Animations**: Smooth animations for feedback and markers
- **Disabled Controls**: Panning and zooming are disabled as required

## Setup Instructions

1. **Get a Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Maps JavaScript API
   - Create credentials (API Key)
   - Copy your API key

2. **Configure the API Key**:
   - Open `index.html`
   - Find the line: `<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap" async defer></script>`
   - Replace `YOUR_API_KEY` with your actual Google Maps API key

3. **Open the Application**:
   - Open `index.html` in a web browser (Chrome recommended)
   - The map should load centered on CSUN campus

## How to Play

1. Read the location name displayed at the top
2. Double-click on the map where you think that location is
3. You'll see:
   - A marker showing your answer
   - A marker showing the correct location
   - A colored circle indicating the correct area (green if correct, red if wrong)
   - A feedback message
4. After 5 locations, you'll see your final score and time
5. Click "Play Again" to restart

## Game Locations

The game includes 5 locations on CSUN campus:
- Bayramian Hall (instructor's choice)
- BookStore
- Jacaranda Hall
- Manzanita Hall
- Citrus Hall

## Technical Details

- **HTML5**: Structure and layout
- **CSS3**: Styling with animations and responsive design
- **JavaScript**: Game logic and Google Maps API integration
- **jQuery**: DOM manipulation (optional, can be removed if needed)
- **Google Maps API**: Map rendering and location services
- **localStorage**: High score persistence

## Browser Compatibility

Tested and optimized for Chrome. Should work in other modern browsers.

## Notes

- Panning and zooming are disabled as per requirements
- The game uses a radius-based checking system to determine if answers are correct
- All markers and circles are cleared between questions
- Timer starts when the game begins and stops when all 5 locations are completed

