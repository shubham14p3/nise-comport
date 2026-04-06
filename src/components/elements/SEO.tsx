import { type FC, useEffect } from "react";
import { Helmet } from "react-helmet";
import { type SEOProps } from "../../types/SEOProps";

const SEO: FC<SEOProps> = ({
    title = "Home",
    description = "Multipurpose React Js Template",
    url = "https://domain.com",
    name = "Envato Markectplace",
    type = "website",
    imageUrl,
}) => {
    const siteSuffix = " .";
    const fullTitle = `${title}${siteSuffix}`;

    useEffect(() => {
        // Force update document title
        document.title = fullTitle;
    }, [fullTitle]);

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />
            <meta property="og:site_name" content={name} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            {imageUrl && <meta property="og:image" content={imageUrl} />}
        </Helmet>
    );
};

export default SEO;
