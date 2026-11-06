import React, { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  className?: string;
  width?: number;
  height?: number;
}

export default function AdsterraAd({ type, className = '', width, height }: AdsterraAdProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Script-based ads for Type 1, 2, 3
  useEffect(() => {
    if (!ref.current) return;
    if (type === 1 || type === 2 || type === 3) {
      ref.current.innerHTML = '';
      if (type === 1) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://beavercolourfuldelinquent.com/96/b0/81/96b081c84962ad9696bc9ede738092f3.js';
        script.async = true;
        ref.current.appendChild(script);
      } else if (type === 2) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://beavercolourfuldelinquent.com/51/88/94/518894b483b474f8220f8770b6104fa0.js';
        script.async = true;
        ref.current.appendChild(script);
      } else if (type === 3) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://beavercolourfuldelinquent.com/1cd1da2ef14f3430dc78f359d3b2aef7/invoke.js';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        const adDiv = document.createElement('div');
        adDiv.id = 'container-1cd1da2ef14f3430dc78f359d3b2aef7';
        ref.current.appendChild(script);
        ref.current.appendChild(adDiv);
      }
    }
  }, [type]);

  // For banner formats (Type 4, 5, 6, 7, 8), srcDoc iframe provides 100% reliable execution
  const getBannerConfig = (t: number) => {
    switch (t) {
      case 5:
        return { 
          key: '57b1778a18bfab0b89f9329f8afd2f94', 
          width: 468, 
          height: 60,
          scriptUrl: 'https://beavercolourfuldelinquent.com/57b1778a18bfab0b89f9329f8afd2f94/invoke.js'
        };
      case 6:
        return { 
          key: 'bceb400c908a798012cbb710154135c4', 
          width: 160, 
          height: 300,
          scriptUrl: 'https://beavercolourfuldelinquent.com/bceb400c908a798012cbb710154135c4/invoke.js'
        };
      case 7:
        return { 
          key: '0594184d427941b4b8b44566505772f4', 
          width: 320, 
          height: 50,
          scriptUrl: 'https://beavercolourfuldelinquent.com/0594184d427941b4b8b44566505772f4/invoke.js'
        };
      case 8:
      case 4: // Official updated 300x250 Adsterra banner
        return { 
          key: '4967cbfcaa28634ee789c79453e4abbb', 
          width: 300, 
          height: 250,
          scriptUrl: 'https://bauval.org/22/4967cbfcaa28634ee789c79453e4abbb'
        };
      default:
        return null;
    }
  };

  const banner = getBannerConfig(type);

  if (banner) {
    const finalWidth = width || banner.width;
    const finalHeight = height || banner.height;
    const scriptSrc = banner.scriptUrl;

    const srcDocHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${banner.key}',
      'format' : 'iframe',
      'height' : ${banner.height},
      'width' : ${banner.width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="${scriptSrc}"></script>
</body>
</html>`;

    return (
      <div className={`w-full flex justify-center items-center my-3 overflow-hidden ${className}`}>
        <iframe
          title="Ad"
          width={finalWidth}
          height={finalHeight}
          style={{ border: 'none', maxWidth: '100%', overflow: 'hidden' }}
          scrolling="no"
          srcDoc={srcDocHtml}
        />
      </div>
    );
  }

  // Type 1, 2, 3 container
  return (
    <div className={`w-full flex justify-center items-center my-2 overflow-hidden ${className}`}>
      <div ref={ref} className="max-w-full overflow-hidden flex items-center justify-center" />
    </div>
  );
}
