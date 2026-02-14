/**
 * Loads all mushroom data from the JSON files in the data/mushrooms directory.
 * @returns {Promise<{allMushrooms: Array<object>, defaultMushroom: object}>}
 */
export const loadMushroomData = async () => {
  // Use Vite's glob import to find all mushroom JSON files
  const mushroomModules = import.meta.glob('../data/mushrooms/*.json');
  
  // Create an array of promises, where each promise resolves to a mushroom module
  const mushroomPromises = Object.values(mushroomModules).map(importer => importer());
  
  // Wait for all mushroom modules to be loaded
  const loadedModules = await Promise.all(mushroomPromises);
  
  // Extract the default export (the mushroom data) from each module
  const allMushrooms = loadedModules.map(module => module.default);
  
  // Find the mushroom marked as default, or fall back to the first one if none is marked
  const defaultMushroom = allMushrooms.find(m => m.default) || allMushrooms[0];
  
  return {
    allMushrooms,
    defaultMushroom,
  };
};
