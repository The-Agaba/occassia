import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const defaultSEO = {
  title: 'Occassia - Modern Wedding & Event Guest Management Platform',
  description: 'Occassia is a comprehensive wedding and events guest management platform. Streamline check-ins, track live attendance, manage guest lists, and optimize event operations.',
  keywords: 'wedding guest management, event check-in, event management platform, guest tracking, wedding events',
  ogImage: '/new-favicon.svg',
};

export default function SEO({
  title = defaultSEO.title,
  description = defaultSEO.description,
  keywords = defaultSEO.keywords,
  ogImage = defaultSEO.ogImage,
  noIndex = false,
}: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    document.title = title;
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', keywords);
    
    // Update Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    const canonicalUrl = new URL(location.pathname, window.location.origin).toString();
    const absoluteImage = new URL(ogImage, window.location.origin).toString();
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:image', absoluteImage);
    updateMetaTag('og:url', canonicalUrl);
    
    // Update Twitter tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:image', absoluteImage);
    updateMetaTag('twitter:url', canonicalUrl);
    
    // Handle noindex
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (noIndex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.setAttribute('content', 'index, follow');
    }
    
    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
    
  }, [title, description, keywords, ogImage, noIndex, location]);

  return null;
}

function updateMetaTag(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) || 
              document.querySelector(`meta[name="${property}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(property.startsWith('og:') || property.startsWith('twitter:') ? 'property' : 'name', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
