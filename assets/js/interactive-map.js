(function () {
  'use strict';

  const initialiseMap = (canvas) => {
    if (!window.L || canvas.dataset.mapInitialised === 'true') return null;

    const section = canvas.closest('.interactive-map');
    const configElement = section?.querySelector('[data-interactive-map-config]');
    if (!configElement) return null;

    let config;
    try {
      config = JSON.parse(configElement.textContent);
    } catch (error) {
      console.error('Unable to read interactive map configuration.', error);
      return null;
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
    canvas.dataset.mapInitialised = 'true';

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
      const markerSize = Math.max(16, Math.min(96, Number(marker.size) || 32));
      const markerMinZoom = Number.isFinite(Number(marker.minZoom))
        ? Number(marker.minZoom)
        : map.getMinZoom();
      const iconPath = marker.icon || '/SVG/position-marker.svg';
      const outlineWidth = Math.max(0, Math.min(12, Number(marker.outlineWidth) || 0));
      const outlineDiagonal = outlineWidth * Math.SQRT1_2;
      const outlineColor = marker.outlineColor || 'var(--color-map-marker-outline)';
      const enlargeSize = Math.max(1, Math.min(2, Number(config.markerEnlargeSize) || 1.2));
      const transitionTime = String(config.markerTransitionTime || '200ms');
      const icon = window.L.divIcon({
        className: 'interactive-map__marker-shell',
        html: `<span class="interactive-map__marker-icon" aria-hidden="true" style="--interactive-map-marker-icon: url('${encodeURI(iconPath).replace(/'/g, '%27')}'); --interactive-map-marker-outline-width: ${outlineWidth}px; --interactive-map-marker-outline-diagonal: ${outlineDiagonal}px; --interactive-map-marker-outline-color: ${outlineColor}; --interactive-map-marker-enlarge-size: ${enlargeSize}; --interactive-map-marker-transition-time: ${transitionTime}"><img class="interactive-map__marker-icon-fallback" src="${encodeURI(iconPath).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" alt=""><i class="interactive-map__marker-outline interactive-map__marker-outline--n"></i><i class="interactive-map__marker-outline interactive-map__marker-outline--ne"></i><i class="interactive-map__marker-outline interactive-map__marker-outline--e"></i><i class="interactive-map__marker-outline interactive-map__marker-outline--se"></i><i class="interactive-map__marker-outline interactive-map__marker-outline--s"></i><i class="interactive-map__marker-outline interactive-map__marker-outline--sw"></i><i class="interactive-map__marker-outline interactive-map__marker-outline--w"></i><i class="interactive-map__marker-outline interactive-map__marker-outline--nw"></i><i class="interactive-map__marker-fill"></i></span>`,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize],
        popupAnchor: [0, -markerSize],
      });
      const mapMarker = window.L.marker([y, x], {
        icon,
        title: marker.title || 'Map marker',
        keyboard: true,
      });

      const syncMarkerVisibility = () => {
        const shouldShow = map.getZoom() >= markerMinZoom;
        if (shouldShow && !map.hasLayer(mapMarker)) mapMarker.addTo(map);
        if (!shouldShow && map.hasLayer(mapMarker)) map.removeLayer(mapMarker);
      };

      const popup = document.createElement('div');
      popup.className = 'interactive-map__popup';

      const title = document.createElement('h3');
      title.className = 'interactive-map__popup-title';
      title.textContent = marker.title || 'Map marker';
      popup.appendChild(title);

      if (marker.thumbnail) {
        const thumbnailWidth = Math.max(80, Math.min(600, Number(marker.thumbnailWidth) || 260));
        const thumbnailHeight = Math.max(60, Math.min(450, Number(marker.thumbnailHeight) || 150));
        const thumbnail = document.createElement('img');
        thumbnail.className = 'interactive-map__popup-thumbnail';
        thumbnail.src = marker.thumbnail;
        thumbnail.alt = marker.thumbnailAlt || '';
        thumbnail.loading = 'lazy';
        thumbnail.decoding = 'async';
        thumbnail.width = thumbnailWidth;
        thumbnail.height = thumbnailHeight;
        thumbnail.style.setProperty(
          '--interactive-map-thumbnail-width',
          `${thumbnailWidth}px`,
        );
        thumbnail.style.setProperty(
          '--interactive-map-thumbnail-height',
          `${thumbnailHeight}px`,
        );
        popup.appendChild(thumbnail);
      }

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

      mapMarker.bindPopup(popup, {
        maxWidth: Math.max(300, Math.min(640, (Number(marker.thumbnailWidth) || 268) + 32)),
      });
      mapMarker.on('popupopen', () => {
        mapMarker.getElement()?.classList.add('interactive-map__marker-shell--selected');
      });
      mapMarker.on('popupclose', () => {
        mapMarker.getElement()?.classList.remove('interactive-map__marker-shell--selected');
      });
      map.on('zoomend', syncMarkerVisibility);
      syncMarkerVisibility();
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

    return map;
  };

  const initialiseMaps = () => {
    document.querySelectorAll('.interactive-map').forEach((section) => {
      const canvas = section.querySelector('[data-interactive-map]');
      const activateButton = section.querySelector('[data-interactive-map-activate]');
      const hideButton = section.querySelector('[data-interactive-map-hide]');
      const gateMaxWidth = Number(section.dataset.mapGateMaxWidth) || 768;
      const mobileQuery = window.matchMedia(`(max-width: ${gateMaxWidth}px)`);
      const gated = section.classList.contains('interactive-map--activation-gated');
      let map = null;

      if (!canvas) return;

      const ensureMap = () => {
        if (!map) map = initialiseMap(canvas);
        window.requestAnimationFrame(() => map?.invalidateSize({ pan: false }));
      };

      const activate = () => {
        section.classList.add('interactive-map--mobile-active');
        activateButton?.setAttribute('aria-expanded', 'true');
        ensureMap();
      };

      const hide = () => {
        section.classList.remove('interactive-map--mobile-active');
        activateButton?.setAttribute('aria-expanded', 'false');
        activateButton?.focus();
      };

      const syncViewport = () => {
        if (!gated || !mobileQuery.matches) {
          ensureMap();
        } else {
          section.classList.remove('interactive-map--mobile-active');
          activateButton?.setAttribute('aria-expanded', 'false');
        }
      };

      activateButton?.setAttribute('aria-expanded', 'false');
      activateButton?.addEventListener('click', activate);
      hideButton?.addEventListener('click', hide);
      mobileQuery.addEventListener?.('change', syncViewport);
      syncViewport();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseMaps);
  } else {
    initialiseMaps();
  }
})();
