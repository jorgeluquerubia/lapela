'use client';

import Header from '../../components/Header';

export default function PublishAd() {
  const [saleType, setSaleType] = useState('fixed');

  useEffect(() => {
    const priceLabel = document.querySelector('label[for="price"]') as HTMLLabelElement;
    if (priceLabel) {
      if (saleType === 'auction') {
        priceLabel.textContent = "Precio 'Cómpralo ya' (opcional)";
      } else {
        priceLabel.textContent = "Precio (€)";
      }
    }
  }, [saleType]);

  return (
    <>
      <Header />

      <main className="container">
        <section className="publish-form">
          <h1>Publicar un nuevo anuncio</h1>
          <form>
            <label htmlFor="title">Título del anuncio</label>
            <input type="text" id="title" name="title" required />

            <label htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows={6} required></textarea>

            <label htmlFor="price">Precio (€)</label>
            <input type="number" id="price" name="price" required />

            <div id="auction-fields" className={saleType === 'auction' ? '' : 'hidden'}>
              <label htmlFor="start-price">Precio de salida (€)</label>
              <input type="number" id="start-price" name="start-price" />

              <label htmlFor="end-date">Fecha de finalización</label>
              <input type="datetime-local" id="end-date" name="end-date" />
            </div>

            <label>Tipo de venta</label>
            <div className="radio-group">
              <input
                type="radio"
                id="fixed"
                name="sale-type"
                value="fixed"
                checked={saleType === 'fixed'}
                onChange={() => setSaleType('fixed')}
              />
              <label htmlFor="fixed">Precio Fijo</label>
              <input
                type="radio"
                id="auction"
                name="sale-type"
                value="auction"
                checked={saleType === 'auction'}
                onChange={() => setSaleType('auction')}
              />
              <label htmlFor="auction">Subasta</label>
            </div>

            <label htmlFor="images">Imágenes</label>
            <input type="file" id="images" name="images" multiple />

            <button type="submit" className="button primary">Publicar Anuncio</button>
          </form>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 LaPela. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}
