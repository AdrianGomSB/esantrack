import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const getColorPorEstado = (estado) => {
  switch (estado) {
    case "pendiente":
      return "bg-yellow-500";
    case "en camino":
      return "bg-blue-500";
    case "completada":
      return "bg-green-500";
    default:
      return "bg-gray-400";
  }
};

// Componente que ajusta el zoom automáticamente
const AjustarVista = ({ puntos }) => {
  const map = useMap();

  useEffect(() => {
    if (puntos.length > 0) {
      const bounds = L.latLngBounds(puntos.map((p) => p.coords));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [puntos, map]);

  return null;
};

const Mapa = ({
  titulo = "Ruta",
  puntos = [
    { coords: [-12.0464, -77.0428], estado: "pendiente" },
    { coords: [-12.1, -77.05], estado: "en camino" },
    { coords: [-12.2, -76.9], estado: "completada" },
  ],
}) => {
  const perulimit = [
    [-18.5, -81.4],
    [-0.05, -68.5],
  ];
  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;

    const response = await fetch(
      `http://localhost:5000/api/geocodificar/inversa?lat=${lat}&lon=${lng}`
    );
    const data = await response.json();

    if (data.direccion) {
      // Actualiza el input (puedes hacerlo con un prop o estado global)
      setDireccion(data.direccion); // Esta función debe venir como prop desde el padre
    }
  };

  return (
    <MapContainer
      center={puntos.length > 0 ? puntos[0].coords : [-12.0464, -77.0428]}
      zoom={6}
      scrollWheelZoom={false}
      className="h-[500px] w-full rounded"
      maxBounds={perulimit}
      maxBoundsViscosity={1.0}
      onClick={handleMapClick}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AjustarVista puntos={puntos} />

      {puntos.map((punto, index) => {
        const colorClase = getColorPorEstado(punto.estado);
        const icon = L.divIcon({
          className: "custom-icon",
          html: `<div class="${colorClase} text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">${
            index + 1
          }</div>`,
          iconSize: [24, 24],
        });

        return (
          <Marker key={index} position={punto.coords} icon={icon}>
            <Popup>
              <strong>Punto {index + 1}</strong>
              <br />
              Estado: {punto.estado}
            </Popup>
          </Marker>
        );
      })}

      <Polyline
        positions={puntos.map((p) => p.coords)}
        pathOptions={{ color: "blue", weight: 3 }}
      />
    </MapContainer>
  );
};

export default Mapa;
