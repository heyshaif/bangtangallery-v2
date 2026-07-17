import React, { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  className?: string;
}

export default function AdsterraAd({ type, className = '' }: AdsterraAdProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';

    switch (type) {
      case 1: {
        // Script 1
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://beavercolourfuldelinquent.com/96/b0/81/96b081c84962ad9696bc9ede738092f3.js';
        script.async = true;
        ref.current.appendChild(script);
        break;
      }
      case 2: {
        // Script 2
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://beavercolourfuldelinquent.com/51/88/94/518894b483b474f8220f8770b6104fa0.js';
        script.async = true;
        ref.current.appendChild(script);
        break;
      }
      case 3: {
        // Script 3 (Data-cfasync with target div)
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://beavercolourfuldelinquent.com/1cd1da2ef14f3430dc78f359d3b2aef7/invoke.js';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        
        const adDiv = document.createElement('div');
        adDiv.id = 'container-1cd1da2ef14f3430dc78f359d3b2aef7';

        ref.current.appendChild(script);
        ref.current.appendChild(adDiv);
        break;
      }
      case 4: {
        // Script 4 - Direct link (Rendered as clean responsive iframe to act as a banner)
        const iframe = document.createElement('iframe');
        iframe.src = 'https://beavercolourfuldelinquent.com/ydkiq3941?key=108ebd91132cda98cac02626d32e1621';
        iframe.width = '300';
        iframe.height = '250';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        iframe.style.overflow = 'hidden';
        iframe.scrolling = 'no';
        ref.current.appendChild(iframe);
        break;
      }
      case 5: {
        // Script 5 - key: 57b1778a18bfab0b89f9329f8afd2f94 (468x60)
        const scriptConf = document.createElement('script');
        scriptConf.innerHTML = `
          atOptions = {
            'key' : '57b1778a18bfab0b89f9329f8afd2f94',
            'format' : 'iframe',
            'height' : 60,
            'width' : 468,
            'params' : {}
          };
        `;
        const scriptSrc = document.createElement('script');
        scriptSrc.type = 'text/javascript';
        scriptSrc.src = 'https://beavercolourfuldelinquent.com/57b1778a18bfab0b89f9329f8afd2f94/invoke.js';
        scriptSrc.async = true;

        ref.current.appendChild(scriptConf);
        ref.current.appendChild(scriptSrc);
        break;
      }
      case 6: {
        // Script 6 - key: bceb400c908a798012cbb710154135c4 (160x300)
        const scriptConf = document.createElement('script');
        scriptConf.innerHTML = `
          atOptions = {
            'key' : 'bceb400c908a798012cbb710154135c4',
            'format' : 'iframe',
            'height' : 300,
            'width' : 160,
            'params' : {}
          };
        `;
        const scriptSrc = document.createElement('script');
        scriptSrc.type = 'text/javascript';
        scriptSrc.src = 'https://beavercolourfuldelinquent.com/bceb400c908a798012cbb710154135c4/invoke.js';
        scriptSrc.async = true;

        ref.current.appendChild(scriptConf);
        ref.current.appendChild(scriptSrc);
        break;
      }
      case 7: {
        // Script 7 - key: 0594184d427941b4b8b44566505772f4 (320x50)
        const scriptConf = document.createElement('script');
        scriptConf.innerHTML = `
          atOptions = {
            'key' : '0594184d427941b4b8b44566505772f4',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        `;
        const scriptSrc = document.createElement('script');
        scriptSrc.type = 'text/javascript';
        scriptSrc.src = 'https://beavercolourfuldelinquent.com/0594184d427941b4b8b44566505772f4/invoke.js';
        scriptSrc.async = true;

        ref.current.appendChild(scriptConf);
        ref.current.appendChild(scriptSrc);
        break;
      }
      case 8: {
        // Script 8 - key: 4967cbfcaa28634ee789c79453e4abbb (300x250)
        const scriptConf = document.createElement('script');
        scriptConf.innerHTML = `
          atOptions = {
            'key' : '4967cbfcaa28634ee789c79453e4abbb',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        `;
        const scriptSrc = document.createElement('script');
        scriptSrc.type = 'text/javascript';
        scriptSrc.src = 'https://beavercolourfuldelinquent.com/4967cbfcaa28634ee789c79453e4abbb/invoke.js';
        scriptSrc.async = true;

        ref.current.appendChild(scriptConf);
        ref.current.appendChild(scriptSrc);
        break;
      }
    }
  }, [type]);

  // Set minimum height based on standard layout sizing
  const getMinHeight = () => {
    if (type === 5) return '60px';
    if (type === 6) return '300px';
    if (type === 7) return '50px';
    if (type === 8 || type === 4) return '250px';
    return '50px';
  };

  return (
    <div className={`w-full flex justify-center items-center my-4 overflow-hidden py-2 ${className}`}>
      <div 
        ref={ref} 
        className="max-w-full overflow-hidden flex items-center justify-center" 
        style={{ minHeight: getMinHeight() }} 
      />
    </div>
  );
}
