import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bridgesApi } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ChevronRight, ChevronLeft, Send, Save, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';

interface FormData {
  tipo: string; elementoAForzar: string; equipo: string;
  necesidadMotivo: string; descripcionDetallada: string;
  riesgosIdentificados: string; escenariosEmergencia: string;
  variablesControl: string; valoresMaxMin: string; medidasContencion: string;
}

type EquipoStatus = 'idle' | 'loading' | 'valid' | 'invalid' | 'unavailable';

const steps = ['Información Básica', 'Análisis de Riesgos', 'Controles Alternativos', 'Medidas de Contención', 'Revisión'];

export function BridgeCreate() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    tipo: 'OPERATIVO', elementoAForzar: '', equipo: '',
    necesidadMotivo: '', descripcionDetallada: '',
    riesgosIdentificados: '', escenariosEmergencia: '',
    variablesControl: '', valoresMaxMin: '', medidasContencion: ''
  });

  // Estado de validación JDE
  const [equipoStatus, setEquipoStatus] = useState<EquipoStatus>('idle');
  const [equipoDescripcion, setEquipoDescripcion] = useState('');

  const set = (k: keyof FormData, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'equipo') {
      setEquipoStatus('idle');
      setEquipoDescripcion('');
    }
  };

  const validarEquipo = async () => {
    const id = form.equipo.trim();
    if (!id) return;
    setEquipoStatus('loading');
    try {
      const res = await api.get('/bridges/validate-equipment', { params: { equipoId: id } });
      const data = res.data;
      if (data.error === 'JDE_UNAVAILABLE') {
        setEquipoStatus('unavailable');
      } else if (data.valid) {
        setEquipoStatus('valid');
        setEquipoDescripcion(data.descripcion || '');
      } else {
        setEquipoStatus('invalid');
      }
    } catch {
      setEquipoStatus('unavailable');
    }
  };

  const createMut = useMutation({
    mutationFn: (data: FormData) => bridgesApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['bridges'] });
      return res.data.id;
    }
  });

  const handleSave = async (submit = false) => {
    try {
      const res = await createMut.mutateAsync(form);
      const id = res.data.id;
      if (submit) {
        await bridgesApi.submit(id);
        toast.success('Puente enviado para aprobación');
      } else {
        toast.success('Borrador guardado');
      }
      navigate(`/bridges/${id}`);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al guardar');
    }
  };

  const canNext = () => {
    if (step === 0) {
      const baseOk = form.tipo && form.elementoAForzar && form.equipo;
      // Bloquear si JDE respondió y el equipo es inválido
      if (equipoStatus === 'invalid') return false;
      return baseOk;
    }
    if (step === 1) return form.necesidadMotivo;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Steps */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{i < step ? '✓' : i + 1}</div>
            {i < steps.length - 1 && <div className={`h-1 w-16 mx-1 rounded ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 mb-6">Paso {step + 1} de {steps.length}: <span className="font-medium text-gray-700">{steps[step]}</span></p>

      <div className="card space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Puente *</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input-field">
                <option value="OPERATIVO">Operativo</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Elemento a Forzar *</label>
              <input value={form.elementoAForzar} onChange={e => set('elementoAForzar', e.target.value)}
                className="input-field" placeholder="Ej: Válvula XV-101, Sensor PT-205..." />
            </div>

            {/* Campo Equipo con validación JDE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipo / Sistema *
                <span className="text-xs text-gray-400 font-normal ml-2">(se valida contra JDE F1201)</span>
              </label>
              <div className="relative">
                <input
                  value={form.equipo}
                  onChange={e => set('equipo', e.target.value)}
                  onBlur={validarEquipo}
                  className={`input-field pr-10 ${
                    equipoStatus === 'valid'       ? 'border-green-400 focus:ring-green-300' :
                    equipoStatus === 'invalid'     ? 'border-red-400 focus:ring-red-300' :
                    equipoStatus === 'unavailable' ? 'border-yellow-400 focus:ring-yellow-300' : ''
                  }`}
                  placeholder="Ingresá el ID del equipo en JDE (APID)..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {equipoStatus === 'loading'     && <Loader size={18} className="text-blue-500 animate-spin" />}
                  {equipoStatus === 'valid'        && <CheckCircle size={18} className="text-green-500" />}
                  {equipoStatus === 'invalid'      && <XCircle size={18} className="text-red-500" />}
                  {equipoStatus === 'unavailable'  && <AlertTriangle size={18} className="text-yellow-500" />}
                </div>
              </div>

              {/* Mensajes de estado */}
              {equipoStatus === 'valid' && equipoDescripcion && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} /> {equipoDescripcion}
                </p>
              )}
              {equipoStatus === 'valid' && !equipoDescripcion && (
                <p className="mt-1 text-sm text-green-600">✓ Equipo verificado en JDE</p>
              )}
              {equipoStatus === 'invalid' && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <XCircle size={14} /> Equipo no encontrado en JDE F1201. Verificá el ID ingresado.
                </p>
              )}
              {equipoStatus === 'unavailable' && (
                <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
                  <AlertTriangle size={14} /> No se pudo conectar a JDE. Podés continuar pero verificá el equipo manualmente.
                </p>
              )}
              {equipoStatus === 'idle' && form.equipo && (
                <p className="mt-1 text-xs text-gray-400">Salí del campo para validar contra JDE</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Detallada</label>
              <textarea value={form.descripcionDetallada} onChange={e => set('descripcionDetallada', e.target.value)}
                className="input-field" rows={3} placeholder="Descripción adicional del puente..." />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Necesidad / Motivo *</label>
              <textarea value={form.necesidadMotivo} onChange={e => set('necesidadMotivo', e.target.value)}
                className="input-field" rows={4} placeholder="Describir por qué se necesita el puente y qué se logra con él..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Riesgos Identificados</label>
              <textarea value={form.riesgosIdentificados} onChange={e => set('riesgosIdentificados', e.target.value)}
                className="input-field" rows={3} placeholder="Riesgos asociados a la operación con el puente activo..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escenarios de Emergencia</label>
              <textarea value={form.escenariosEmergencia} onChange={e => set('escenariosEmergencia', e.target.value)}
                className="input-field" rows={3} placeholder="Posibles escenarios de emergencia a considerar..." />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variables de Control Alternativo</label>
              <textarea value={form.variablesControl} onChange={e => set('variablesControl', e.target.value)}
                className="input-field" rows={3} placeholder="Variables que se monitorearán como alternativa al sistema inhibido..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valores Máximos / Mínimos</label>
              <input value={form.valoresMaxMin} onChange={e => set('valoresMaxMin', e.target.value)}
                className="input-field" placeholder='Ej: {"max": 50, "min": 10, "unidad": "psi"}' />
            </div>
          </>
        )}

        {step === 3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medidas de Contención</label>
            <textarea value={form.medidasContencion} onChange={e => set('medidasContencion', e.target.value)}
              className="input-field" rows={5} placeholder="Acciones preventivas, controles adicionales, responsables..." />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Revisión del Puente</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Tipo:</span> <span className="font-medium">{form.tipo}</span></div>
              <div><span className="text-gray-500">Elemento:</span> <span className="font-medium">{form.elementoAForzar}</span></div>
              <div className="col-span-2">
                <span className="text-gray-500">Equipo:</span>{' '}
                <span className="font-medium">{form.equipo}</span>
                {equipoDescripcion && <span className="text-gray-400 ml-2">— {equipoDescripcion}</span>}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium">⚠️ Al enviar, el puente quedará en espera de aprobación del Jefe de Turno (Nivel 1).</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn-secondary flex items-center gap-1 disabled:opacity-40">
            <ChevronLeft size={16} /> Anterior
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={createMut.isPending} className="btn-secondary flex items-center gap-1">
              <Save size={16} /> Guardar Borrador
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="btn-primary flex items-center gap-1 disabled:opacity-40">
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={() => handleSave(true)} disabled={createMut.isPending} className="btn-primary flex items-center gap-2">
                <Send size={16} /> Enviar para Aprobación
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
