/** Your own photos, added by `npm run photos` (scripts/photos.mjs). You can edit titles and alt text here. */
export type GalleryPhoto = { src: string; width: number; height: number; title: string; alt: string; service: string; hash: string; addedOn: string };

export const galleryPhotos: GalleryPhoto[] = [];
