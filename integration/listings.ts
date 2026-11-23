export const products = {
  radio: {
    title: 'Radio portátil Bruma',
    description: 'Radio FM de carcasa verde agua. La antena funciona y el dial responde bien. Tiene roces visibles en un lateral.',
    story: 'La llevábamos al taller los sábados para escuchar música mientras arreglábamos muebles.',
    category: 'Tecnología', condition: 'Con señales de uso', location: 'Madrid',
    photo: 'radio.jpg', mode: 'sale', delivery: 'pickup', price: 25,
  },
  lamp: {
    title: 'Lámpara de cerámica Ámbar',
    description: 'Base de cerámica acanalada y pantalla de lino claro. Incluye bombilla cálida probada y un cable con interruptor.',
    category: 'Hogar', condition: 'Como nuevo', location: 'Valencia',
    photo: 'lamp.jpg', mode: 'sale', delivery: 'shipping', price: 39.5, shipping: 6.25,
  },
  backpack: {
    title: 'Mochila de senderismo Abeto',
    description: 'Mochila de día con tirantes ajustables y bolsillo frontal. La cremallera principal funciona. Espalda ligeramente marcada.',
    category: 'Deporte', condition: 'Buen estado', location: 'Bilbao',
    photo: 'backpack.jpg', mode: 'auction', delivery: 'shipping', price: 18, shipping: 4,
  },
  rover: {
    title: 'Explorador de hojalata Órbita',
    description: 'Vehículo espacial de juguete con ruedas naranjas. El mecanismo de cuerda gira y la pintura tiene un pequeño desgaste.',
    category: 'Coleccionismo', condition: 'Con señales de uso', location: 'Sevilla',
    photo: 'rover.jpg', mode: 'auction', delivery: 'pickup', price: 20, buy_now: 55,
  },
  coat: {
    title: 'Abrigo de lana Granate',
    description: 'Abrigo corto de lana forrada, talla mediana. Lleva una coderilla de refuerzo y los botones originales.',
    category: 'Moda', condition: 'Buen estado', location: 'Zaragoza',
    photo: 'coat.jpg', mode: 'sale', delivery: 'shipping', price: 28, shipping: 5.75,
  },
  plane: {
    title: 'Cepillo de carpintería Cedro',
    description: 'Cepillo manual de cuerpo de cedro, con pomo azul y tornillo de ajuste de latón. La cuchilla necesita afilado.',
    story: 'Se usó durante años para ajustar los cajones de un pequeño taller familiar.',
    category: 'Otros', condition: 'Con señales de uso', location: 'Granada',
    photo: 'plane.jpg', mode: 'sale', delivery: 'pickup', price: 32,
  },
} as const;
