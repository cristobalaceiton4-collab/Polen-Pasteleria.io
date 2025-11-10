// Variables globales
let usuarioActual = null;
let categorias = [];
let productos = [];

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, verificando sesión...');
  verificarSesion();
  configurarEventListeners();
});

// Verificar si hay sesión activa
function verificarSesion() {
  const sesion = localStorage.getItem('polen_admin_sesion');
  
  if (sesion) {
    try {
      const datos = JSON.parse(sesion);
      usuarioActual = datos;
      console.log('Sesión encontrada:', datos);
      mostrarPanel();
      cargarDashboard();
    } catch (error) {
      console.error('Error al parsear sesión:', error);
      localStorage.removeItem('polen_admin_sesion');
      mostrarLogin();
    }
  } else {
    console.log('No hay sesión activa');
    mostrarLogin();
  }
}

// Mostrar pantalla de login
function mostrarLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

// Mostrar panel admin
function mostrarPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'flex';
}

// ===== EVENT LISTENERS =====
function configurarEventListeners() {
  // Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Navegación del sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const section = e.currentTarget.dataset.section;
      cambiarSeccion(section);
    });
  });
  
  // Botón nuevo producto
  const btnNuevoProducto = document.getElementById('btn-nuevo-producto');
  if (btnNuevoProducto) {
    btnNuevoProducto.addEventListener('click', abrirModalNuevoProducto);
  }
  
  // Modal
  const modalClose = document.getElementById('modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', cerrarModal);
  }
  
  const btnCancelar = document.getElementById('btn-cancelar');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', cerrarModal);
  }
  
  const formProducto = document.getElementById('form-producto');
  if (formProducto) {
    formProducto.addEventListener('submit', handleGuardarProducto);
  }
  
  // Preview de imagen
  const productoImagen = document.getElementById('producto-imagen');
  if (productoImagen) {
    productoImagen.addEventListener('change', previewImagen);
  }
}

// ===== LOGIN/LOGOUT =====
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  console.log('Intentando login con usuario:', username);
  
  // Ocultar error previo
  errorDiv.style.display = 'none';
  
  // Deshabilitar botón
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verificando...';
  
  try {
    // Intentar login
    const resultado = await loginAdmin(username, password);
    
    console.log('Resultado del login:', resultado);
    
    if (resultado.success) {
      // Guardar sesión
      usuarioActual = resultado.user;
      localStorage.setItem('polen_admin_sesion', JSON.stringify(resultado.user));
      
      console.log('Login exitoso, mostrando panel');
      
      // Mostrar panel
      mostrarPanel();
      cargarDashboard();
    } else {
      // Mostrar error
      errorDiv.textContent = resultado.message || 'Error al iniciar sesión';
      errorDiv.style.display = 'block';
      console.error('Error de login:', resultado.message);
    }
  } catch (error) {
    console.error('Error en handleLogin:', error);
    errorDiv.textContent = 'Error al conectar con el servidor. Verifica tu conexión.';
    errorDiv.style.display = 'block';
  } finally {
    // Rehabilitar botón
    submitBtn.disabled = false;
    submitBtn.textContent = 'Iniciar Sesión';
  }
}

function handleLogout() {
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    localStorage.removeItem('polen_admin_sesion');
    usuarioActual = null;
    mostrarLogin();
  }
}

// ===== NAVEGACIÓN =====
function cambiarSeccion(section) {
  // Actualizar navegación activa
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-section="${section}"]`).classList.add('active');
  
  // Ocultar todas las secciones
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active');
  });
  
  // Mostrar sección seleccionada
  document.getElementById(`${section}-section`).classList.add('active');
  
  // Actualizar título
  const titulos = {
    dashboard: 'Dashboard',
    productos: 'Gestión de Productos',
    mensajes: 'Mensajes de Contacto',
    estadisticas: 'Estadísticas'
  };
  document.getElementById('section-title').textContent = titulos[section];
  
  // Cargar datos según la sección
  switch(section) {
    case 'dashboard':
      cargarDashboard();
      break;
    case 'productos':
      cargarProductos();
      break;
    case 'mensajes':
      cargarMensajes();
      break;
    case 'estadisticas':
      cargarEstadisticas();
      break;
  }
}

// ===== DASHBOARD =====
async function cargarDashboard() {
  try {
    console.log('Cargando dashboard...');
    
    // Obtener estadísticas
    const estadisticas = await getEstadisticas();
    const productos = await getTodosLosProductos();
    const mensajes = await getMensajes();
    
    // Visitas de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const estadHoy = estadisticas.find(e => e.fecha === hoy);
    document.getElementById('total-visitas').textContent = estadHoy ? estadHoy.visitas : 0;
    
    // Total productos
    document.getElementById('total-productos').textContent = productos.length;
    
    // Mensajes no leídos
    const mensajesNoLeidos = mensajes.filter(m => !m.leido).length;
    document.getElementById('total-mensajes').textContent = mensajesNoLeidos;
    document.getElementById('mensajes-badge').textContent = mensajesNoLeidos;
    
    // Visitas de la semana
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const visitasSemana = estadisticas
      .filter(e => new Date(e.fecha) >= hace7Dias)
      .reduce((sum, e) => sum + e.visitas, 0);
    document.getElementById('visitas-semana').textContent = visitasSemana;
    
    console.log('Dashboard cargado exitosamente');
    
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
  }
}

// ===== PRODUCTOS =====
async function cargarProductos() {
  const container = document.getElementById('productos-lista');
  container.innerHTML = '<div class="loading">Cargando productos...</div>';
  
  try {
    productos = await getTodosLosProductos();
    categorias = await getCategorias();
    
    if (productos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No hay productos</h3>
          <p>Comienza agregando tu primer producto</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    productos.forEach(producto => {
      const categoria = producto.categorias ? producto.categorias.nombre : 'Sin categoría';
      html += `
        <div class="producto-item">
          <img src="${producto.imagen_url}" alt="${producto.nombre}">
          <div class="producto-item-info">
            <h3>${producto.nombre}</h3>
            <p>${categoria}</p>
            <p>${producto.descripcion || ''}</p>
            <div class="producto-precio">$${producto.precio.toLocaleString('es-CL')}</div>
            <div class="producto-actions">
              <button class="btn-edit" onclick="editarProducto(${producto.id})">✏️ Editar</button>
              <button class="btn-delete" onclick="eliminarProductoConfirm(${producto.id})">🗑️ Eliminar</button>
            </div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error al cargar productos:', error);
    container.innerHTML = '<div class="empty-state"><h3>Error al cargar productos</h3></div>';
  }
}

async function abrirModalNuevoProducto() {
  document.getElementById('modal-title').textContent = 'Nuevo Producto';
  document.getElementById('producto-id').value = '';
  document.getElementById('form-producto').reset();
  document.getElementById('preview-imagen').innerHTML = '';
  
  // Cargar categorías
  await cargarCategoriasSelect();
  
  document.getElementById('modal-producto').classList.add('active');
}

async function editarProducto(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;
  
  document.getElementById('modal-title').textContent = 'Editar Producto';
  document.getElementById('producto-id').value = producto.id;
  document.getElementById('producto-nombre').value = producto.nombre;
  document.getElementById('producto-categoria').value = producto.categoria_id;
  document.getElementById('producto-precio').value = producto.precio;
  document.getElementById('producto-descripcion').value = producto.descripcion || '';
  
  // Preview de imagen actual
  if (producto.imagen_url) {
    document.getElementById('preview-imagen').innerHTML = `
      <img src="${producto.imagen_url}" alt="Preview">
    `;
  }
  
  await cargarCategoriasSelect();
  document.getElementById('modal-producto').classList.add('active');
}

async function cargarCategoriasSelect() {
  const select = document.getElementById('producto-categoria');
  categorias = await getCategorias();
  
  let html = '<option value="">Selecciona una categoría</option>';
  categorias.forEach(cat => {
    html += `<option value="${cat.id}">${cat.nombre}</option>`;
  });
  
  select.innerHTML = html;
}

function cerrarModal() {
  document.getElementById('modal-producto').classList.remove('active');
}

function previewImagen(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('preview-imagen').innerHTML = `
        <img src="${event.target.result}" alt="Preview">
      `;
    };
    reader.readAsDataURL(file);
  }
}

async function handleGuardarProducto(e) {
  e.preventDefault();
  
  const productoId = document.getElementById('producto-id').value;
  const nombre = document.getElementById('producto-nombre').value;
  const categoriaId = parseInt(document.getElementById('producto-categoria').value);
  const precio = parseInt(document.getElementById('producto-precio').value);
  const descripcion = document.getElementById('producto-descripcion').value;
  const imagenFile = document.getElementById('producto-imagen').files[0];
  
  // Deshabilitar botón
  const btnGuardar = document.getElementById('btn-guardar');
  const textoOriginal = btnGuardar.textContent;
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Guardando...';
  
  try {
    let imagenUrl = null;
    
    // Si hay imagen nueva, subirla
    if (imagenFile) {
      const resultadoImagen = await subirImagen(imagenFile);
      if (resultadoImagen.success) {
        imagenUrl = resultadoImagen.url;
      } else {
        throw new Error('Error al subir imagen');
      }
    } else if (productoId) {
      // Si es edición y no hay imagen nueva, mantener la actual
      const productoActual = productos.find(p => p.id == productoId);
      imagenUrl = productoActual.imagen_url;
    }
    
    const productoData = {
      nombre,
      categoria_id: categoriaId,
      precio,
      descripcion,
      imagen_url: imagenUrl,
      activo: true
    };
    
    let resultado;
    if (productoId) {
      // Actualizar
      resultado = await actualizarProducto(productoId, productoData);
    } else {
      // Crear nuevo
      resultado = await crearProducto(productoData);
    }
    
    if (resultado.success) {
      alert(productoId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
      cerrarModal();
      cargarProductos();
    } else {
      throw new Error('Error al guardar producto');
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert('Hubo un error al guardar el producto. Por favor intenta nuevamente.');
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = textoOriginal;
  }
}

async function eliminarProductoConfirm(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;
  
  if (confirm(`¿Estás seguro que deseas eliminar "${producto.nombre}"?`)) {
    const resultado = await eliminarProducto(id);
    if (resultado.success) {
      alert('Producto eliminado exitosamente');
      cargarProductos();
    } else {
      alert('Error al eliminar el producto');
    }
  }
}

// ===== MENSAJES =====
async function cargarMensajes() {
  const container = document.getElementById('mensajes-lista');
  container.innerHTML = '<div class="loading">Cargando mensajes...</div>';
  
  try {
    const mensajes = await getMensajes();
    
    if (mensajes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No hay mensajes</h3>
          <p>Aquí aparecerán los mensajes de tus clientes</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    mensajes.forEach(mensaje => {
      const fecha = new Date(mensaje.created_at).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      html += `
        <div class="mensaje-item ${!mensaje.leido ? 'no-leido' : ''}">
          <div class="mensaje-header">
            <div class="mensaje-info">
              <h4>${mensaje.nombre}</h4>
              <p>📧 ${mensaje.email} | 📞 ${mensaje.telefono || 'No especificado'}</p>
            </div>
            <span class="mensaje-fecha">${fecha}</span>
          </div>
          <div class="mensaje-texto">
            ${mensaje.mensaje}
          </div>
          ${!mensaje.leido ? `
            <div class="mensaje-actions">
              <button class="btn-marcar-leido" onclick="marcarComoLeido(${mensaje.id})">
                ✓ Marcar como leído
              </button>
            </div>
          ` : ''}
        </div>
      `;
    });
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
    container.innerHTML = '<div class="empty-state"><h3>Error al cargar mensajes</h3></div>';
  }
}

async function marcarComoLeido(id) {
  const resultado = await marcarMensajeLeido(id);
  if (resultado.success) {
    cargarMensajes();
    cargarDashboard(); // Actualizar contador
  }
}

// ===== ESTADÍSTICAS =====
async function cargarEstadisticas() {
  try {
    const estadisticas = await getEstadisticas();
    
    // Preparar datos para el gráfico
    const labels = [];
    const data = [];
    
    estadisticas.reverse().forEach(est => {
      const fecha = new Date(est.fecha).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit'
      });
      labels.push(fecha);
      data.push(est.visitas);
    });
    
    // Crear gráfico simple con Canvas
    const canvas = document.getElementById('visitas-chart');
    const ctx = canvas.getContext('2d');
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configurar canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    // Dibujar gráfico de barras simple
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barWidth = chartWidth / data.length;
    const maxValue = Math.max(...data, 1);
    
    // Dibujar barras
    ctx.fillStyle = '#4a6fa5';
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * barWidth;
      const y = canvas.height - padding - barHeight;
      
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
      
      // Etiquetas
      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x + barWidth / 2, canvas.height - 10);
      ctx.fillText(value, x + barWidth / 2, y - 5);
      ctx.fillStyle = '#4a6fa5';
    });
    
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Hacer funciones globales para onclick
window.editarProducto = editarProducto;
window.eliminarProductoConfirm = eliminarProductoConfirm;
window.marcarComoLeido = marcarComoLeido;