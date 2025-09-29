import { Component, onMount, onCleanup } from 'solid-js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SimpleMapProps {
  onPlayerMove: (latitude: number, longitude: number) => void;
  onHistoricalSiteClick: (site: any) => void;
}

const SimpleMap: Component<SimpleMapProps> = (props) => {
  let mapContainer: HTMLDivElement;
  let map: L.Map | undefined;

  onMount(() => {
    console.log('🗺️ Initializing Leaflet Map');

    // Create Leaflet map
    map = L.map(mapContainer, {
      center: [25.0330, 121.5654], // Taiwan
      zoom: 10,
      zoomControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Add a marker for Taiwan
    const marker = L.marker([25.0330, 121.5654])
      .addTo(map)
      .bindPopup('台灣 Taiwan')
      .openPopup();

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      console.log(`Map clicked at: ${lat}, ${lng}`);
      props.onPlayerMove(lat, lng);
    });

    console.log('✅ Leaflet Map initialized successfully');
  });

  onCleanup(() => {
    if (map) {
      map.remove();
    }
  });

  return (
    <div class="w-full h-full relative">
      <div
        ref={mapContainer!}
        class="w-full h-full"
        style="min-height: 400px; height: calc(100vh - 65px);"
      />

      {/* Simple position display */}
      <div class="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg">
        <div class="text-sm font-medium">Leaflet Map Active</div>
        <div class="text-xs text-gray-600">Click anywhere to move</div>
      </div>
    </div>
  );
};

export default SimpleMap;