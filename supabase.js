// Funciones de API para Supabase

// Obtener todas las categorías
async function getCategorias() {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('activo', true)
      .order('orden');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return [];
  }
}

// Obtener productos por categoría
async function getProductosPorCategoria(categoriaId) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('categoria_id', categoriaId)
      .eq('activo', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
}

// Obtener todos los productos
async function getTodosLosProductos() {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias (nombre, slug)
      `)
      .eq('activo', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
}

// Insertar mensaje de contacto
async function insertarMensajeContacto(mensaje) {
  try {
    const { data, error } = await supabase
      .from('mensajes_contacto')
      .insert([mensaje])
      .select();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al insertar mensaje:', error);
    return { success: false, error };
  }
}

// Registrar visita (estadísticas)
async function registrarVisita() {
  try {
    const fecha = new Date().toISOString().split('T')[0];
    
    const { data: estadistica, error: errorBuscar } = await supabase
      .from('estadisticas')
      .select('*')
      .eq('fecha', fecha)
      .maybeSingle();
    
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
  } catch (error) {
    console.error('Error en registrarVisita:', error);
  }
}

// ===== FUNCIONES ADMIN =====

// Login de admin - VERSIÓN MEJORADA
async function loginAdmin(username, password) {
  try {
    console.log('Buscando usuario en base de datos:', username);
    
    const { data, error } = await supabase
      .from('usuarios_admin')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
    if (error) {
      console.error('Error al buscar usuario:', error);
      return { success: false, message: 'Error al conectar con la base de datos' };
    }
    
    if (!data) {
      console.log('Usuario no encontrado');
      return { success: false, message: 'Usuario no encontrado' };
    }
    
    console.log('Usuario encontrado, verificando contraseña...');
    
    // Verificar contraseña (comparación directa por ahora)
    if (data.password_hash === password) {
      console.log('Contraseña correcta');
      // No devolver el password en la respuesta
      const { password_hash, ...userSinPassword } = data;
      return { success: true, user: userSinPassword };
    } else {
      console.log('Contraseña incorrecta');
      return { success: false, message: 'Contraseña incorrecta' };
    }
  } catch (error) {
    console.error('Error en loginAdmin:', error);
    return { success: false, message: 'Error inesperado al iniciar sesión' };
  }
}

// Crear producto
async function crearProducto(producto) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .insert([producto])
      .select();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al crear producto:', error);
    return { success: false, error };
  }
}

// Actualizar producto
async function actualizarProducto(id, producto) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update(producto)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return { success: false, error };
  }
}

// Eliminar producto
async function eliminarProducto(id) {
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return { success: false, error };
  }
}

// Subir imagen
async function subirImagen(file) {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('productos-imagenes')
      .upload(fileName, file);
    
    if (error) throw error;
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('productos-imagenes')
      .getPublicUrl(fileName);
    
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return { success: false, error };
  }
}

// Obtener mensajes de contacto
async function getMensajes() {
  try {
    const { data, error } = await supabase
      .from('mensajes_contacto')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return [];
  }
}

// Marcar mensaje como leído
async function marcarMensajeLeido(id) {
  try {
    const { error } = await supabase
      .from('mensajes_contacto')
      .update({ leido: true })
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error al marcar mensaje:', error);
    return { success: false };
  }
}

// Obtener estadísticas
async function getEstadisticas() {
  try {
    const { data, error } = await supabase
      .from('estadisticas')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(30);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return [];
  }
}