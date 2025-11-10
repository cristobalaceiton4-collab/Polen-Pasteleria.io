// Navegación responsive
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
  navToggle.classList.toggle('active');
});

// Cerrar menú al hacer click en un enlace
document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
  });
});

// Navbar al hacer scroll
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Tabs del menú
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    
    // Remover active de todos
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    
    // Agregar active al clickeado
    btn.classList.add('active');
    document.getElementById(targetTab).classList.add('active');
  });
});

// Animación de productos al scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, index * 100);
    }
  });
}, observerOptions);

// Smooth scroll para navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    
    if (target) {
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// ===== CARGAR DATOS DINÁMICOS DESDE SUPABASE =====

let categoriaActual = 'todas';

// Cargar categorías y productos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  // Registrar visita
  await registrarVisita();
  
  // Cargar categorías
  await cargarCategorias();
  
  // Cargar todos los productos
  await cargarProductos();
  
  // Configurar formulario de contacto
  configurarFormularioContacto();
});

// Cargar categorías como tabs
async function cargarCategorias() {
  const categoriasContainer = document.getElementById('categoria-tabs');
  const categorias = await getCategorias();
  
  if (!categorias || categorias.length === 0) {
    categoriasContainer.innerHTML = '<p>No hay categorías disponibles</p>';
    return;
  }
  
  let html = '<button class="categoria-tab active" data-categoria="todas">Todas</button>';
  
  categorias.forEach(cat => {
    html += `<button class="categoria-tab" data-categoria="${cat.id}">${cat.nombre}</button>`;
  });
  
  categoriasContainer.innerHTML = html;
  
  // Event listeners para las tabs de categorías
  document.querySelectorAll('.categoria-tab').forEach(tab => {
    tab.addEventListener('click', async (e) => {
      // Remover active de todos
      document.querySelectorAll('.categoria-tab').forEach(t => t.classList.remove('active'));
      
      // Agregar active al clickeado
      e.target.classList.add('active');
      
      // Filtrar productos
      const categoriaId = e.target.dataset.categoria;
      categoriaActual = categoriaId;
      await cargarProductos();
    });
  });
}

// Cargar productos
async function cargarProductos() {
  const productosGrid = document.getElementById('productos-grid');
  productosGrid.innerHTML = '<div class="loading">Cargando productos...</div>';
  
  let productos;
  
  if (categoriaActual === 'todas') {
    productos = await getTodosLosProductos();
  } else {
    productos = await getProductosPorCategoria(parseInt(categoriaActual));
  }
  
  if (!productos || productos.length === 0) {
    productosGrid.innerHTML = '<p class="no-productos">No hay productos disponibles en esta categoría</p>';
    return;
  }
  
  let html = '';
  productos.forEach(producto => {
    html += `
      <div class="producto-card">
        <div class="producto-image">
          <img src="${producto.imagen_url}" alt="${producto.nombre}">
          <div class="producto-overlay">
            <button class="btn-secondary">Ver Detalles</button>
          </div>
        </div>
        <div class="producto-info">
          <h3>${producto.nombre}</h3>
          <p>${producto.descripcion || 'Delicioso producto artesanal'}</p>
          ${producto.precio ? `<p class="producto-precio">$${producto.precio.toLocaleString('es-CL')}</p>` : ''}
        </div>
      </div>
    `;
  });
  
  productosGrid.innerHTML = html;
  
  // Observar las nuevas tarjetas para animación
  document.querySelectorAll('.producto-card').forEach(card => {
    observer.observe(card);
  });
}

// Configurar formulario de contacto
function configurarFormularioContacto() {
  const contactForm = document.getElementById('contact-form');
  
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const mensaje = {
      nombre: formData.get('nombre'),
      email: formData.get('email'),
      telefono: formData.get('telefono'),
      mensaje: formData.get('mensaje')
    };
    
    // Deshabilitar botón
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    // Insertar en Supabase
    const resultado = await insertarMensajeContacto(mensaje);
    
    if (resultado.success) {
      alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
      contactForm.reset();
    } else {
      alert('Hubo un error al enviar el mensaje. Por favor intenta nuevamente.');
    }
    
    // Rehabilitar botón
    submitBtn.disabled = false;
    submitBtn.textContent = textoOriginal;
  });
}