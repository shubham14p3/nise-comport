// // // Import all images from assets folder
// // const images = import.meta.glob("../assets/images/**/*", { eager: true });

// // export const getImage = (path) => {
// //     const imagePath = `../assets/images/${path}`;
// //     return images[imagePath]?.default || ""; // Use default export or empty string if not found
// // };

// // Create a context to import all images within the assets/images folder
// const images = require.context('../assets/images', true);

// export const getImage = (path) => {
//     try {
//         return images(`./${path}`);
//     } catch (e) {
//         console.error(`Image not found: ${path}`);
//         return ''; }
// };
// src/data/getImage.js

// 1. Glob-import all images under /src/assets/images (eagerly so URLs are resolved at build time)
const images = import.meta.glob('/src/assets/images/**/*.{png,jpg,jpeg,svg,gif}', { eager: true });

// 2. Export a helper that maps “relative path” → URL
export function getImage(path) {
    // Normalize incoming path: no leading slash, exactly match your folder structure
    const key = `/src/assets/images/${path.replace(/^\/+/, '')}`;
    const file = images[key];
    if (file) {
        // each entry is an object: { default: 'URL' }
        return file.default;
    }
    console.warn(`Image not found at: ${key}`);
    return '';
}

export function fixHtmlImagePaths(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const imgs = doc.querySelectorAll("img");
    imgs.forEach((img) => {
        const originalSrc = img.getAttribute("src");
        const fixedSrc = getImage(originalSrc);
        if (fixedSrc) {
            img.setAttribute("src", fixedSrc);
        }
    });

    return doc.body.innerHTML;
}
