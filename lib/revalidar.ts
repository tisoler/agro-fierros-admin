// Llama al endpoint de revalidación de la tienda tras cada mutación,
// para invalidar las páginas ISR cacheadas (tags).
export const revalidarTienda = async (tags: string[]) => {
  const urlTienda = process.env.TIENDA_URL || 'http://localhost:3000';
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    console.error('REVALIDATION_SECRET no definido: no se revalida la tienda.');
    return;
  }

  try {
    const respuesta = await fetch(`${urlTienda}/api/revalidar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, tags }),
      cache: 'no-store',
    });
    if (!respuesta.ok) {
      console.error('Error revalidando la tienda:', respuesta.status);
    }
  } catch (error) {
    console.error('Error revalidando la tienda:', error);
  }
};
