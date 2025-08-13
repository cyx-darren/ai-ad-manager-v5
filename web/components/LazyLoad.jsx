// web/components/LazyLoad.jsx
import React, { useState, useEffect, useRef } from 'react';

/**
 * Lazy loading wrapper component
 * Renders children only when they come into view
 */
const LazyLoad = ({ 
  children, 
  height = 200, 
  offset = 100,
  placeholder = null,
  className = '',
  once = true 
}) => {
  const [inView, setInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          setHasLoaded(true);
          
          // Disconnect observer if we only want to load once
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setInView(false);
        }
      },
      {
        rootMargin: `${offset}px`,
        threshold: 0.1
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [offset, once]);

  const shouldRender = once ? hasLoaded : inView;

  return (
    <div 
      ref={elementRef} 
      className={className}
      style={{ minHeight: !shouldRender ? height : 'auto' }}
    >
      {shouldRender ? children : (placeholder || <div className="animate-pulse bg-gray-200 rounded" style={{ height }} />)}
    </div>
  );
};

export default LazyLoad;