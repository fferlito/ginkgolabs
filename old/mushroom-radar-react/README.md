# Mushroom Radar Dashboard - React Version

This is a React.js refactored version of the original Mushroom Radar Dashboard, providing better maintainability, performance, and development experience.

## Features

- **Interactive 3D Map**: Mapbox GL JS with terrain and satellite views
- **Date Selection**: Calendar component for selecting prediction dates
- **Real-time Data**: Integration with Ellipsis Drive API for mushroom prediction data
- **Responsive Design**: Mobile and desktop optimized
- **Layer Controls**: Toggle visibility and basemap styles
- **Prediction Popups**: Click on map areas to see mushroom probability

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js)

## Installation & Setup

1. **Navigate to the project directory**:
   ```bash
   cd mushroom-radar-react
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and go to `http://localhost:3000`

## Project Structure

```
mushroom-radar-react/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── Map/           # Map-related components
│   │   │   ├── MapContainer.jsx
│   │   │   └── MushroomPopup.jsx
│   │   ├── Calendar/      # Date selection
│   │   │   └── DateSelector.jsx
│   │   ├── UI/            # UI controls
│   │   │   ├── BasemapToggle.jsx
│   │   │   └── Legend.jsx
│   │   └── Layout/        # Layout components
│   │       ├── Dashboard.jsx
│   │       └── Header.jsx
│   ├── context/           # React Context for state
│   │   └── DashboardContext.jsx
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   └── styles/            # CSS files
├── package.json
└── vite.config.js
```

## Key Technologies

- **React 18**: Modern React with hooks and context
- **Vite**: Fast build tool and dev server
- **react-map-gl**: React wrapper for Mapbox GL JS
- **Mapbox GL JS**: Interactive maps with 3D terrain
- **Moment.js**: Date handling and formatting

## API Integration

The dashboard integrates with the Ellipsis Drive API for mushroom prediction data:
- **Today's predictions**: Real-time data
- **Tomorrow's predictions**: Next-day forecasts  
- **Future predictions**: Extended forecasts

## State Management

Uses React Context API with useReducer for:
- Selected date management
- Map style toggling
- Layer visibility control
- Map instance storage

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Comparison with Original

### Advantages of React Version:
- **Better Performance**: Virtual DOM and optimized re-renders
- **Maintainability**: Component-based architecture
- **Type Safety**: Can be easily converted to TypeScript
- **Testing**: Component-level testing support
- **State Management**: Predictable state updates
- **Development Experience**: Hot module replacement, better debugging

### Migration Benefits:
- **Reusable Components**: Map, Calendar, Controls can be reused
- **Easier Feature Addition**: Component isolation makes new features easier
- **Better Error Handling**: React error boundaries
- **Modern Tooling**: ESLint, Prettier, and modern build tools

## Deployment

To build for production:

```bash
npm run build
```

The `dist` folder will contain the optimized production build.

## Configuration

### Mapbox Token
The Mapbox access token is currently hardcoded in `MapContainer.jsx`. For production, consider using environment variables:

```javascript
// .env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### API Endpoints
Ellipsis Drive API endpoints are configured in `DashboardContext.jsx`.

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

This project maintains the same license as the original GINKGOLABS dashboard.
