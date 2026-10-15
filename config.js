// =========================================================
// config.js · AU Originals by Ale Urdaneta
// Lo único que normalmente hay que tocar para actualizar la tienda.
// =========================================================

const CONFIG = {
  // WhatsApp de la tienda: código de país + número, solo dígitos.
  whatsapp: "584124721159",

  // Tasa euro oficial del BCV (Bs). Se actualiza sola desde tasaURL;
  // este número solo se usa si la consulta falla y no hay una tasa guardada.
  tasaAutomatica: true,
  tasaURL: "https://ve.dolarapi.com/v1/euros/oficial",
  tasaBs: 982,

  // Usuario de Instagram sin @.
  instagram: "auoriginals",

  // Saludo con el que empieza cada mensaje de WhatsApp.
  saludo: "Hola AU Originals ✨"
};
