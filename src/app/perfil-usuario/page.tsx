import Link from 'next/link';

export default function UserProfile() {
  return (
    <>
      <header>
        <div className="container">
          <div className="logo">
            <Link href="/">LaPela 🪙</Link>
          </div>
          <nav>
            <Link href="/publish-ad" className="button">Publicar Anuncio</Link>
            <Link href="/login">Iniciar Sesión</Link>
          </nav>
        </div>
      </header>

      <main className="container">
        <section className="user-profile">
          <div className="profile-header">
            <div className="avatar"></div>
            <h2>Nombre de Usuario</h2>
          </div>
          <h3>Mis Anuncios</h3>
          <div className="product-grid">
            <div className="grid-container">
              <div className="grid-container">
                <div className="product-card">
                  <div className="product-image" style={{ backgroundImage: 'url('https://picsum.photos/id/201/400/300')' }}></div>
                  <div className="product-info">
                    <h3>Mi Anuncio 1</h3>
                    <p className="price">100€</p>
                    <p className="meta">Publicado hace 1 semana</p>
                  </div>
                </div>
                <div className="product-card">
                  <div className="product-image" style={{ backgroundImage: 'url('https://picsum.photos/id/202/400/300')' }}></div>
                  <div className="product-info">
                    <h3>Mi Anuncio 2</h3>
                    <p className="price">50€</p>
                    <p className="meta">Publicado hace 2 semanas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 LaPela. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}
