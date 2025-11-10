// Funciones de API para Supabase

// Obtener todas las categorías
async function getCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('activo', true)
    .order('orden');
  
  if (error) {
    console.error('Error al obtener categorías:', error);
    return [];
  }
  return data;
}

// Obtener productos por categoría
async function getProductosPorCategoria(categoriaId) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('categoria_id', categoriaId)
    .eq('activo', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
  return data;
}

// Obtener todos los productos
async function getTodosLosProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      categorias (nombre, slug)
    `)
    .eq('activo', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
  return data;
}

// Insertar mensaje de contacto
async function insertarMensajeContacto(mensaje) {
  const { data, error } = await supabase
    .from('mensajes_contacto')
    .insert([mensaje])
    .select();
  
  if (error) {
    console.error('Error al insertar mensaje:', error);
    return { success: false, error };
  }
  return { success: true, data };
}

// Registrar visita (estadísticas)
async function registrarVisita() {
  const fecha = new Date().toISOString().split('T')[0];
  
  const { data: estadistica, error: errorBuscar } = await supabase
    .from('estadisticas')
    .select('*')
    .eq('fecha', fecha)
    .single();
  
  if (estadistica) {
    // Actualizar visitas
    const { error } = await supabase
      .from('estadisticas')
      .update({ visitas: estadistica.visitas + 1 })
      .eq('fecha', fecha);
    
    if (error) console.error('Error al actualizar visita:', error);
  } else {
    // Crear nuevo registro
    const { error } = await supabase
      .from('estadisticas')
      .insert([{ fecha, visitas: 1, mensajes: 0 }]);
    
    if (error) console.error('Error al crear estadística:', error);
  }
}

// ===== FUNCIONES ADMIN =====

// Login de admin
async function loginAdmin(username, password) {
  const { data, error } = await supabase
    .from('usuarios_admin')
    .select('*')
    .eq('username', username)
    .single();
  
  if (error || !data) {
    return { success: false, message: 'Usuario no encontrado' };
  }
  
  // Verificar contraseña (simple - en producción usar bcrypt)
  if (data.password_hash === password) {
    return { success: true, user: data };
  } else {
    return { success: false, message: 'Contraseña incorrecta' };
  }
}

// Crear producto
async function crearProducto(producto) {
  const { data, error } = await supabase
    .from('productos')
    .insert([producto])
    .select();
  
  if (error) {
    console.error('Error al crear producto:', error);
    return { success: false, error };
  }
  return { success: true, data };
}

// Actualizar producto
async function actualizarProducto(id, producto) {
  const { data, error } = await supabase
    .from('productos')
    .update(producto)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error al actualizar producto:', error);
    return { success: false, error };
  }
  return { success: true, data };
}

// Eliminar producto
async function eliminarProducto(id) {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error al eliminar producto:', error);
    return { success: false, error };
  }
  return { success: true };
}

// Subir imagen
async function subirImagen(file) {
  const fileName = `${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('productos-imagenes')
    .upload(fileName, file);
  
  if (error) {
    console.error('Error al subir imagen:', error);
    return { success: false, error };
  }
  
  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('productos-imagenes')
    .getPublicUrl(fileName);
  
  return { success: true, url: urlData.publicUrl };
}

// Obtener mensajes de contacto
async function getMensajes() {
  const { data, error } = await supabase
    .from('mensajes_contacto')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error al obtener mensajes:', error);
    return [];
  }
  return data;
}

// Marcar mensaje como leído
async function marcarMensajeLeido(id) {
  const { error } = await supabase
    .from('mensajes_contacto')
    .update({ leido: true })
    .eq('id', id);
  
  if (error) {
    console.error('Error al marcar mensaje:', error);
    return { success: false };
  }
  return { success: true };
}

// Obtener estadísticas
async function getEstadisticas() {
  const { data, error } = await supabase
    .from('estadisticas')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(30);
  
  if (error) {
    console.error('Error al obtener estadísticas:', error);
    return [];
  }
  return data;
}