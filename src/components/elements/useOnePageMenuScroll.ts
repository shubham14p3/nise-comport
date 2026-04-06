import { useEffect, useContext } from 'react';
import FinrisContext from '@/components/context/FinrisContext';

export function useOnePageMenuScroll() {
  const context = useContext(FinrisContext);
  const setActiveSection = context?.setActiveSection;

  useEffect(() => {
    if (!setActiveSection) return;
    setActiveSection('home');

    function handleScroll() {
      if (!setActiveSection) return;

      const windscroll = window.scrollY;
      const offset = 100;

      if (windscroll >= 117) {
        const sections = ['home', 'about', 'services', 'project', 'team', 'testimonial', 'contact', 'blog'];
        const scrollPosition = windscroll + offset;

        for (let i = sections.length - 1; i >= 0; i--) {
          const section = document.getElementById(sections[i]);

          if (section) {
            const sectionTop = section.getBoundingClientRect().top + window.scrollY;

            if (sectionTop <= scrollPosition) {
              setActiveSection(sections[i]);
              return;
            }
          }
        }
      } else {
        setActiveSection('home');
      }
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [setActiveSection]);
}
