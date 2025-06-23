import React from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const getIconByTipo = (tipo) => {
  switch (tipo) {
    case "Empresas":
      return "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
    case "Institutos":
      return "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
    case "Ferias":
      return "https://maps.google.com/mapfiles/ms/icons/orange-dot.png";
    case "Charlas":
      return "https://maps.google.com/mapfiles/ms/icons/purple-dot.png";
    case "Activaciones":
      return "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
    default:
      return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
  }
};

const GoogleMapComponent = ({ puntos, ruta }) => {
  const puntosValidos = puntos.filter(
    (p) =>
      typeof p.latitud === "number" &&
      !isNaN(p.latitud) &&
      typeof p.longitud === "number" &&
      !isNaN(p.longitud)
  );

  const center = puntosValidos.length
    ? { lat: puntosValidos[0].latitud, lng: puntosValidos[0].longitud }
    : { lat: -12.0464, lng: -77.0428 };

  console.log("CLAVE API desde ENV:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <div className="relative w-full h-full">
      {/* Información de la ruta */}
      {ruta && (
        <div className="absolute top-0 left-0 p-4 bg-white bg-opacity-90 z-10 shadow-md rounded-lg">
          <h2 className="text-lg font-bold text-blue-600">Mapa de la Ruta</h2>
          <p className="text-sm text-gray-700">
            <strong>Título:</strong> {ruta.titulo || "Sin título"} <br />
            <strong>Fecha:</strong>{" "}
            {ruta.fecha
              ? new Date(ruta.fecha).toLocaleDateString()
              : "Sin fecha"}{" "}
            <br />
            <strong>Progreso:</strong>{" "}
            {
              puntos.filter((p) => p.estado?.toLowerCase() === "completado")
                .length
            }{" "}
            / {puntos.length}
          </p>
        </div>
      )}
      {/* Mapa */}
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {puntosValidos.map((p, i) => (
          <Marker
            key={i}
            position={{ lat: p.latitud, lng: p.longitud }}
            icon={{
              url: getIconByTipo(p.tipo),
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            label={{
              text: p.nombre || "",
              color: "#000",
              fontSize: "10px",
            }}
          />
        ))}

        {puntosValidos.length > 1 && (
          <Polyline
            path={puntosValidos.map((p) => ({
              lat: p.latitud,
              lng: p.longitud,
            }))}
            options={{ strokeColor: "#0000FF", strokeOpacity: 0.8 }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default GoogleMapComponent;
