// Decoración de servidor: el movimiento vive en CSS y respeta movimiento
// reducido. No captura clicks ni agrega JavaScript al layout.
export function Atmosphere() {
  return (
    <div className="app-atmosphere" aria-hidden="true">
      <div className="atmosphere-light atmosphere-light-lime" />
      <div className="atmosphere-light atmosphere-light-green" />
      <div className="atmosphere-lines" />
    </div>
  )
}
