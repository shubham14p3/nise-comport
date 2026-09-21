import PropTypes from "prop-types";
import { useEffect } from "react";

function upsertMeta(name, content, attribute = "name") {
  if (!content) return;
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

const SEO = ({ title, description, canonical, robots = "index, follow", structuredData }) => {
  useEffect(() => {
    if (title) document.title = title;
    upsertMeta("description", description || "NISE COMPORT — assisted digital services in Telco, Jamshedpur.");
    upsertMeta("robots", robots);
    upsertMeta("og:title", title, "property");
    upsertMeta("og:description", description || "NISE COMPORT — assisted digital services in Telco, Jamshedpur.", "property");
    upsertMeta("og:type", "website", "property");

    if (canonical) {
      let link = document.head.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
      upsertMeta("og:url", canonical, "property");
    }

    const id = "nise-structured-data";
    document.getElementById(id)?.remove();
    if (structuredData) {
      const script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
    return () => document.getElementById(id)?.remove();
  }, [title, description, canonical, robots, structuredData]);

  return null;
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  canonical: PropTypes.string,
  robots: PropTypes.string,
  structuredData: PropTypes.object,
};

export default SEO;
