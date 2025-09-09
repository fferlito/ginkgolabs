# React Dashboard Architecture

## Overview
This is a complete React.js refactoring of the original Mushroom Radar Dashboard, providing better maintainability, performance, and development experience while preserving all original functionality.

## Architecture Decisions

### 1. **State Management: React Context + useReducer**
- **Why**: Provides centralized state management without the complexity of Redux
- **Benefits**: Predictable state updates, easy debugging, no external dependencies
- **Location**: `src/context/DashboardContext.jsx`

### 2. **Component Architecture: Separation of Concerns**
```
├── Layout/          # Page structure and navigation
├── Map/             # Map-related functionality  
├── Calendar/        # Date selection components
└── UI/              # Reusable UI controls
```

### 3. **Styling: CSS Modules Approach**
- **Why**: Scoped styles prevent conflicts, easy maintenance
- **Benefits**: Component-specific styles, better organization
- **Location**: Each component has its own `.css` file

### 4. **API Integration: Service Layer**
- **Why**: Separates API logic from components
- **Benefits**: Reusable, testable, easy to mock
- **Location**: `src/services/ellipsisApi.js`

## Key Components

### DashboardContext
**Purpose**: Central state management for the entire dashboard
**State**:
- `selectedDate`: Currently selected date for predictions
- `currentMapStyle`: Active map style (custom/satellite)
- `layerVisible`: Whether mushroom layer is visible
- `tileUrls`: API endpoints for different time periods
- `map`: Mapbox map instance
- `isMapLoaded`: Map loading state

### MapContainer
**Purpose**: Main map component with 3D terrain and data layers
**Features**:
- Mapbox GL JS integration with react-map-gl
- 3D terrain with exaggerated elevation
- Mushroom prediction layers
- Interactive popups
- Navigation and geolocation controls

### DateSelector
**Purpose**: Calendar component for date selection
**Features**:
- Today, tomorrow, and future predictions
- Visual feedback for selected date
- Keyboard accessibility

### UI Components
- **BasemapToggle**: Switch between custom and satellite views
- **Legend**: Shows probability scale and layer visibility toggle
- **Header**: Navigation with mobile menu support

## Data Flow

```
1. User Action (e.g., date selection)
   ↓
2. Component dispatches action to Context
   ↓
3. Reducer updates state
   ↓
4. Components re-render with new state
   ↓
5. Map updates with new data layer
```

## API Integration

### Ellipsis Drive API
- **Purpose**: Provides mushroom prediction data
- **Process**:
  1. Fetch latest timestamp IDs
  2. Update tile URLs with fresh timestamps
  3. Load vector tiles on map
  4. Display predictions with color-coded probabilities

## Performance Optimizations

1. **React.memo**: Prevents unnecessary re-renders
2. **useCallback**: Memoizes event handlers
3. **Lazy Loading**: Components loaded on demand
4. **Error Boundaries**: Graceful error handling
5. **Service Worker**: Caching for better performance

## Development Workflow

### Local Development
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

### File Structure
```
src/
├── components/     # React components
├── context/        # State management
├── hooks/          # Custom React hooks
├── services/       # API integration
├── utils/          # Helper functions
└── styles/         # CSS files
```

## Comparison with Original

### Advantages
✅ **Component Reusability**: Map, Calendar, Controls can be used elsewhere  
✅ **Better Testing**: Component-level unit tests  
✅ **Type Safety**: Easy TypeScript migration  
✅ **Performance**: Virtual DOM optimization  
✅ **Development Experience**: Hot reload, better debugging  
✅ **Maintainability**: Clear separation of concerns  

### Migration Benefits
- **Easier Feature Addition**: Component isolation
- **Better Error Handling**: React error boundaries
- **Modern Tooling**: ESLint, Prettier, Vite
- **State Predictability**: Centralized state management

## Future Enhancements

### Potential Improvements
1. **TypeScript Migration**: Add type safety
2. **Testing Suite**: Jest + React Testing Library
3. **Storybook**: Component documentation
4. **PWA Features**: Offline support, push notifications
5. **Internationalization**: Multi-language support
6. **Performance Monitoring**: Real-time metrics

### Scalability Considerations
- **Code Splitting**: Route-based splitting for larger apps
- **State Management**: Consider Zustand for complex state
- **API Layer**: GraphQL for more efficient data fetching
- **Component Library**: Extract reusable components

## Browser Support
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Bundle Analysis
- **Main Bundle**: ~500KB (includes React, Mapbox GL JS)
- **Vendor Bundle**: ~200KB (moment.js, react-map-gl)
- **CSS Bundle**: ~50KB (styles and Mapbox CSS)

## Security Considerations
- **API Keys**: Use environment variables in production
- **CSP Headers**: Content Security Policy for XSS protection
- **HTTPS**: Required for geolocation and modern features
