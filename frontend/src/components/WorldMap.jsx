import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useState } from "react";
import { numericToAlpha3, alpha3ToName } from "../data/countryCodes";

const GEO_URL = "https://unpkg.com/world-atlas@2/countries-110m.json";
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

// MAPE color scale matching the mockup legend: green (accurate) -> red (high error)
function mapeColor(mape) {
  if (mape == null) return "#1E293B"; // no data yet — neutral slate
  if (mape <= 1) return "#22C55E";
  if (mape <= 2) return "#84CC16";
  if (mape <= 5) return "#EAB308";
  if (mape <= 10) return "#F97316";
  if (mape <= 20) return "#EF4444";
  return "#B91C1C";
}

export default function WorldMap({ countryMape, onSelectCountry, selectedIso }) {
  const [tooltip, setTooltip] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([15, 10]);

  const zoomIn = () => setZoom((z) => Math.min(z * 1.5, MAX_ZOOM));
  const zoomOut = () => setZoom((z) => Math.max(z / 1.5, MIN_ZOOM));
  const resetZoom = () => {
    setZoom(1);
    setCenter([15, 10]);
  };

  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10 flex flex-col overflow-hidden rounded-md border border-slate-700 bg-[#0F1729]">
        <button
          onClick={zoomIn}
          className="flex h-8 w-8 items-center justify-center text-slate-300 hover:bg-slate-800"
          title="Zoom in"
        >
          +
        </button>
        <div className="h-px bg-slate-700" />
        <button
          onClick={zoomOut}
          className="flex h-8 w-8 items-center justify-center text-slate-300 hover:bg-slate-800"
          title="Zoom out"
        >
          &minus;
        </button>
        <div className="h-px bg-slate-700" />
        <button
          onClick={resetZoom}
          className="flex h-8 w-8 items-center justify-center text-[10px] text-slate-300 hover:bg-slate-800"
          title="Reset view"
        >
          ⟲
        </button>
      </div>

      <ComposableMap projectionConfig={{ scale: 175 }} className="h-[300px] w-full sm:h-[360px] lg:h-[400px]">
        <ZoomableGroup
          zoom={zoom}
          center={center}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMoveEnd={({ zoom: z, coordinates }) => {
            setZoom(z);
            setCenter(coordinates);
          }}
          // Block drag-panning only at the default zoom level, so a click
          // reliably selects a country there — but once zoomed in, allow
          // normal click-drag panning to navigate around.
          filterZoomEvent={({ type }) => (zoom > 1 ? true : type !== "mousedown" && type !== "touchstart")}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // geo.id from world-atlas is the numeric ISO code, but it comes
                // zero-padded for codes under 100 (e.g. "036" for Australia,
                // "050" for Bangladesh, "010" for Antarctica). Normalize before
                // looking it up or those countries silently fail to match.
                const numericId = String(parseInt(geo.id, 10));
                const iso = numericToAlpha3[numericId];
                const entry = iso ? countryMape?.[iso] : null;
                const name = entry?.name || (iso ? alpha3ToName[iso] : geo.properties.name);
                const mape = entry?.mape;
                const isSelected = iso === selectedIso;
                const hasData = mape != null;
                const fillColor = mapeColor(mape);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke={isSelected ? "#60A5FA" : hasData ? fillColor : "#0A0F1E"}
                    strokeWidth={
                      isSelected ? Math.max(1.5, 1.5 / zoom) : hasData ? Math.max(0.9, 1 / zoom) : Math.max(0.4, 0.5 / zoom)
                    }
                    onClick={() => iso && onSelectCountry?.(iso, name)}
                    onMouseEnter={() => setTooltip({ name, mape })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: { fill: fillColor, outline: "none" },
                      hover: { fill: fillColor, stroke: "#93C5FD", cursor: "pointer", outline: "none" },
                      pressed: { fill: fillColor, outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-md bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-lg">
          {tooltip.name}
          {tooltip.mape != null && (
            <span className="ml-2 text-blue-400">MAPE: {tooltip.mape.toFixed(2)}%</span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
        <span>0%</span>
        <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-700" />
        <span>20%+</span>
      </div>
      <div className="mt-1 flex justify-between text-[11px]">
        <span className="text-green-400">Low Error</span>
        <span className="text-red-400">High Error</span>
      </div>
    </div>
  );
}
