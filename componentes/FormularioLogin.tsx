'use client';

import { useActionState } from 'react';
import { iniciarSesion } from '@/acciones/auth';

export default function FormularioLogin() {
  const [estado, action, pendiente] = useActionState(iniciarSesion, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-600">
          Contraseña
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          autoFocus
          className="w-full rounded-btn border border-slate-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none"
        />
      </div>
      {estado?.error && (
        <p className="rounded-btn bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>
      )}
      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-btn bg-marca-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-700 disabled:opacity-60"
      >
        {pendiente ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
