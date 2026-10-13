'use client';

import { useRef, useState } from 'react';
import type { Foco } from '@/lib/procesarImagen';

type Props = {
  src: string;
  ancho: number;
  alto: number;
  foco: Foco;
  onTerminar: (foco: Foco) => void;
  maxAlto?: number;
};

// Editor de encuadre estilo foto de perfil: se muestra la foto completa
// oscurecida y borrosa, y un recuadro nítido (con la proporción exacta del
// formato) que se arrastra para elegir qué parte se conserva.
// La posición vive en estado local durante el arrastre (sin re-renders del
// formulario) y se informa al soltar.
export default function EditorEncuadre({ src, ancho, alto, foco, onTerminar, maxAlto = 433 }: Props) {
  const escenario = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{
    inicioX: number;
    inicioY: number;
    fx: number;
    fy: number;
    rangoX: number;
    rangoY: number;
  } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  // Ajuste en vivo durante el arrastre (estado de evento, barato y local).
  // En reposo se usa el foco prop: al cambiar de tab se recentra solo,
  // sin desmontar (los <img> persisten y no se recargan).
  const [ajuste, setAjuste] = useState<Foco | null>(null);
  const pos = ajuste ?? foco;

  const aspecto = ancho / alto;
  const aspectoFoto = natural ? natural.w / natural.h : aspecto;
  // Alto máximo para que encuadre y versiones finales entren en pantalla:
  // se angosta el escenario manteniendo la proporción de la foto.
  const estiloEscenario = natural
    ? { aspectRatio: `${natural.w} / ${natural.h}`, width: `min(100%, ${Math.round((maxAlto * natural.w) / natural.h)}px)`, margin: '0 auto' }
    : { aspectRatio: `${ancho} / ${alto}` };
  // Recuadro más grande posible con la proporción del formato
  const recuadroAncho = aspectoFoto >= aspecto ? (aspecto / aspectoFoto) * 100 : 100;
  const recuadroAlto = aspectoFoto >= aspecto ? 100 : (aspectoFoto / aspecto) * 100;
  const izq = pos.x * (100 - recuadroAncho);
  const sup = pos.y * (100 - recuadroAlto);

  const iniciar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!escenario.current) return;
    const rect = escenario.current.getBoundingClientRect();
    arrastre.current = {
      inicioX: e.clientX,
      inicioY: e.clientY,
      fx: pos.x,
      fy: pos.y,
      rangoX: rect.width * (1 - recuadroAncho / 100),
      rangoY: rect.height * (1 - recuadroAlto / 100),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const limitar = (v: number) => Math.min(1, Math.max(0, v));

  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a) return;
    setAjuste({
      x: a.rangoX > 0 ? limitar(a.fx + (e.clientX - a.inicioX) / a.rangoX) : a.fx,
      y: a.rangoY > 0 ? limitar(a.fy + (e.clientY - a.inicioY) / a.rangoY) : a.fy,
    });
  };

  const terminar = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a) return;
    arrastre.current = null;
    const fin: Foco = {
      x: a.rangoX > 0 ? limitar(a.fx + (e.clientX - a.inicioX) / a.rangoX) : a.fx,
      y: a.rangoY > 0 ? limitar(a.fy + (e.clientY - a.inicioY) / a.rangoY) : a.fy,
    };
    setAjuste(null);
    onTerminar(fin);
  };

  return (
    <div
      ref={escenario}
      className="relative w-full select-none overflow-hidden rounded-btn bg-slate-900"
      style={estiloEscenario}
    >
      {/* Foto completa: oscurecida y borrosa = lo que se recorta */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        onLoad={(e) => {
          const im = e.currentTarget;
          setNatural((previo) =>
            previo && previo.w === im.naturalWidth && previo.h === im.naturalHeight
              ? previo
              : { w: im.naturalWidth, h: im.naturalHeight }
          );
        }}
        className="absolute inset-0 h-full w-full object-fill brightness-[.45] blur-[1.5px]"
      />
      {natural && (
        <div
          className="absolute cursor-move touch-none rounded-[2px] shadow-[0_0_0_2px_#ea580c,0_8px_24px_rgba(0,0,0,.5)]"
          style={{ width: `${recuadroAncho}%`, height: `${recuadroAlto}%`, left: `${izq}%`, top: `${sup}%` }}
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          title="Arrastrá para encuadrar"
        >
          {/* Foto nítida dentro del recuadro, alineada con la de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              draggable={false}
              className="absolute"
              style={{
                width: `${10000 / recuadroAncho}%`,
                height: `${10000 / recuadroAlto}%`,
                maxWidth: 'none',
                left: `${(-izq / recuadroAncho) * 100}%`,
                top: `${(-sup / recuadroAlto) * 100}%`,
              }}
            />
          </div>
          {/* Regla de tercios */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/50" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/50" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-white/50" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white/50" />
          </div>
        </div>
      )}
    </div>
  );
}
