import { redirect } from 'next/navigation';
import { obtenerSesion } from '@/lib/sesion';
import FormularioLogin from '@/componentes/FormularioLogin';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const sesion = await obtenerSesion();
  if (sesion.autenticado) {
    redirect('/unidades');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-card">
        <h1 className="text-xl font-bold text-slate-900">Admin AgroFierros</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">Ingresá con la contraseña del panel.</p>
        <FormularioLogin />
      </div>
    </main>
  );
}
