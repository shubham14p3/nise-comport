// // Import all images from assets folder
// const images = import.meta.glob("../assets/images/**/*", { eager: true });

// export const getImage = (path) => {
//     const imagePath = `../assets/images/${path}`;
//     return images[imagePath]?.default || ""; // Use default export or empty string if not found
// };

// Create a context to import all images within the assets/images folder
const images = require.context('../assets/images', true);

export const getImage = (path) => {
    try {
        return images(`./${path}`);
    } catch (e) {
        console.error(`Image not found: ${path}`);
        return ''; }
};
