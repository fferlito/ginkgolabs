// Ellipsis Drive API service for mushroom data
const BASE_URL = import.meta.env.VITE_ELLIPSIS_API_BASE || "https://api.ellipsis-drive.com/v3"
const PATH_ID = import.meta.env.VITE_ELLIPSIS_PATH_ID || 'b11909f0-3c51-4ab2-a57e-ffaa60335770'

/**
 * Fetch timestamp ID from Ellipsis Drive API
 * @param {string} pathId - The path ID for the layer
 * @returns {Promise<string|null>} - The timestamp ID or null if not found
 */
export const getTimestampId = async (pathId) => {
  try {
    const urlListFolder = `${BASE_URL}/path/${pathId}/folder/list`
    const response = await fetch(urlListFolder)
    
    if (!response.ok) {
      console.warn("Failed to fetch timestamp data:", response.status)
      return null
    }
    
    const data = await response.json()
    const timestamps = data.result
    
    for (const item of timestamps) {
      const timestamp = item.vector.timestamps[0]
      if (timestamp) {
        return timestamp.id
      }
    }
    
    return null
  } catch (error) {
    console.warn("Error fetching timestamp ID:", error)
    return null
  }
}

/**
 * Replace timestamp ID in URL with fetched UUID
 * @param {string} url - The original URL with placeholder timestamp
 * @param {string} pathId - The path ID to fetch timestamp for
 * @returns {Promise<string>} - Updated URL with correct timestamp
 */
export const replaceTimestampIdWithFetchedUUID = async (url, pathId) => {
  const timestampId = await getTimestampId(pathId)
  
  if (timestampId) {
    return url.replace(/timestampId=[^&]+/, `timestampId=${timestampId}`)
  } else {
    console.error("Failed to fetch timestamp ID")
    return url
  }
}

/**
 * Update tile URLs with the latest timestamps
 * @param {Object} tileUrls - Object containing tile URLs for different time periods
 * @returns {Promise<Object>} - Updated tile URLs object
 */
export const updateTileURLs = async (tileUrls) => {
  try {
    const updatedUrls = { ...tileUrls }
    
    // Update each URL with fresh timestamp
    if (tileUrls.today) {
      updatedUrls.today = await replaceTimestampIdWithFetchedUUID(tileUrls.today, PATH_ID)
    }
    if (tileUrls.tomorrow) {
      updatedUrls.tomorrow = await replaceTimestampIdWithFetchedUUID(tileUrls.tomorrow, PATH_ID)
    }
    if (tileUrls.later) {
      updatedUrls.later = await replaceTimestampIdWithFetchedUUID(tileUrls.later, PATH_ID)
    }
    
    console.log('Updated tile URLs:', updatedUrls)
    return updatedUrls
  } catch (error) {
    console.warn('Failed to update tile URLs:', error)
    return tileUrls // Return original URLs if update fails
  }
}

/**
 * Initialize and update tile URLs on app start
 * @returns {Promise<Object>} - Updated tile URLs
 */
export const initializeTileURLs = async () => {
  const newTileURLs = {
    today: 'https://storage.googleapis.com/mushroom-radar-tiles/tiles/{z}/{x}/{y}.pbf?nocache=1',
    tomorrow: 'https://storage.googleapis.com/mushroom-radar-tiles/tiles/{z}/{x}/{y}.pbf?nocache=1',
    later: 'https://storage.googleapis.com/mushroom-radar-tiles/tiles/{z}/{x}/{y}.pbf?nocache=1'
  };

  console.log('Using new tile URLs:', newTileURLs);
  return newTileURLs;
}
