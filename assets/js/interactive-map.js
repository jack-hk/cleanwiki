(function () {
  'use strict';

  const initialiseMap = (canvas) => {
    if (!window.L) return;

    const section = canvas.closest('.interactive-map');
    const configElement = section?.querySelector('[data-interactive-map-config]');
    if (!configElement) return;

    let config;
    try {
      config = JSON.parse(configElement.textContent);
    } catch (error) {
      console.error('Unable to read interactive map configuration.', error);
      return;
    }

    const width = Number(config.imageWidth) || 1536;
    const height = Number(config.imageHeight) || 1024;
    const bounds = window.L.latLngBounds([0, 0], [height, width]);
    const map = window.L.map(canvas, {
      crs: window.L.CRS.Simple,
      minZoom: Number(config.minZoom ?? -2),
      maxZoom: Number(config.maxZoom ?? 2),
      zoomControl: config.zoomControl !== false,
      scrollWheelZoom: config.scrollWheelZoom === true,
      dragging: config.dragging !== false,
      attributionControl: Boolean(config.attribution),
    });

    window.L.imageOverlay(config.image, bounds, {
      alt: config.imageAlt || 'Interactive map',
    }).addTo(map);

    if (config.attribution) {
      map.attributionControl.setPrefix(false);
      map.attributionControl.addAttribution(config.attribution);
    }

    (config.markers || []).forEach((marker) => {
      const x = (Math.max(0, Math.min(100, Number(marker.x))) / 100) * width;
      const yFromTop = (Math.max(0, Math.min(100, Number(marker.y))) / 100) * height;
      const y = height - yFromTop;
      const icon = window.L.divIcon({
        className: 'interactive-map__marker-shell',
        html: '<span class="interactive-map__marker-dot" aria-hidden="true"></span>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });
      const mapMarker = window.L.marker([y, x], {
        icon,
        title: marker.title || 'Map marker',
        keyboard: true,
      }).addTo(map);

      const popup = document.createElement('div');
      popup.className = 'interactive-map__popup';

      const title = document.createElement('h3');
      title.className = 'interactive-map__popup-title';
      title.textContent = marker.title || 'Map marker';
      popup.appendChild(title);

      if (marker.description) {
        const description = document.createElement('div');
        description.className = 'interactive-map__popup-description';
        description.innerHTML = marker.description;
        popup.appendChild(description);
      }

      if (marker.url) {
        const link = document.createElement('a');
        link.className = 'interactive-map__popup-link';
        link.href = marker.url;
        link.textContent = marker.linkLabel || 'Read more';
        popup.appendChild(link);
      }

      mapMarker.bindPopup(popup, { maxWidth: 300 });
    });

    if (config.initialZoom === 'fit' || config.initialZoom === undefined) {
      map.fitBounds(bounds, { padding: [12, 12] });
    } else {
      map.setView(bounds.getCenter(), Number(config.initialZoom));
    }
    map.setMaxBounds(bounds.pad(0.15));

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
      observer.observe(canvas);
    }
  };

  const initialiseMaps = () => {
    document.querySelectorAll('[data-interactive-map]').forEach(initialiseMap);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseMaps);
  } else {
    initialiseMaps();
  }
})();
