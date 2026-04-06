/**
 * Defines the props structure for the SEO component.
 * Properties with '?' are optional, others are required.
 */
export interface SEOProps {
  /** The specific title for the page, added before the site name. */
  title?: string; 

  /** The meta description for search engines. */
  description?: string;

  /** The canonical URL for the page (important for SEO). */
  url?: string; 

  /** The name of the site or author (e.g., 'DevOashim'). Default: 'DevOashim Templates' */
  name?: string;

  /** The Open Graph type (e.g., 'website', 'article', 'product'). Default: 'website' */
  type?: string;

  /** URL of the image to display when shared on social media. */
  imageUrl?: string; 
}