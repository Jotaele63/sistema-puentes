import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bridgesApi } from '../../services/api';
import { EstadoBadge } from '../../components/EstadoBadge';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, Lock, FileText, Activity, MessageSquare } from 'lucide-react';

export function BridgeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState<'approve' | 'reject' | 'close' | 'renew' | 'control' | null>(null);
  const [comentario, setComentario] = useState('');
  const [sigueNecesario, setSigueNecesario] = useState(true);

  const { data: puente, isLoading } = useQuery({
    queryKey: ['bridge', id],
    queryFn: () => bridgesApi.get(id!).then(r => r.data),
  });

  const mutOpts = {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bridge', id] });
      qc.invalidateQueries({ queryKey: ['bridges'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setModal(null);
      setComentario('');
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error'),
  };

  const approveMut = useMutation({ mutationFn: () => bridgesApi.approve(id!, comentario), ...mutOpts, onSuccess: () => { toast.success('Puente aprobado'); mutOpts.onSuccess(); } });
  const rejectMut = useMutation({ mutationFn: () => bridgesApi.reject(id!, comentario), ...mutOpts, onSuccess: () => { toast.success('Puente rechazado'); mutOpts.onSuccess(); } });
  const closeMut = useMutation({ mutationFn: () => bridgesApi.close(id!, comentario), ...mutOpts, onSuccess: () => { toast.success('Puente cerrado'); mutOpts.onSuccess(); } });
  const renewMut = useMutation({ mutationFn: () => bridgesApi.renew(id!, comentario), ...mutOpts, onSuccess: () => { toast.success('Renovación iniciada'); mutOpts.onSuccess(); } });
  const submitMut = useMutation({ mutationFn: () => bridgesApi.submit(id!), ...mutOpts, onSuccess: () => { toast.success('Enviado para aprobación'); mutOpts.onSuccess(); } });
  const activateMut = useMutation({ mutationFn: () => bridgesApi.activate(id!), ...mutOpts, onSuccess: () => { toast.success('Puente marcado como ejecutado'); mutOpts.onSuccess(); } });
  const controlMut = useMutation({ mutationFn: () => bridgesApi.addControl(id!, { observaciones: comentario, sigueSiendoNecesario: sigueNecesario }), ...mutOpts, onSuccess: () => { toast.success('Control registrado'); mutOpts.onSuccess(); } });
  const pdfMut = useMutation({
    mutationFn: () => bridgesApi.pdf(id!),
    onSuccess: (res) => window.open(`http://localhost:3001${res.data.url}`, '_blank'),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!puente) return <div className="text-center py-8 text-gray-500">Puente no encontrado</div>;

  const rol = user?.rol || '';
  const estado = puente.estado;

  const canApprove = (estado === 'PENDIENTE_NIVEL_1' && rol === 'JEFE_TURNO') ||
    (estado === 'PENDIENTE_NIVEL_2' && rol === 'JEFE_AREA') ||
    (estado === 'PENDIENTE_NIVEL_3' && rol === 'GERENTE');

  const canClose = ['APROBADO_NIVEL_1', 'APROBADO_NIVEL_2', 'APROBADO_NIVEL_3', 'PENDIENTE_NIVEL_2', 'PENDIENTE_NIVEL_3'].includes(estado);
  const canRenew = ['APROBADO_NIVEL_1', 'APROBADO_NIVEL_2', 'APROBADO_NIVEL_3'].includes(estado);
  const canActivate = ['APROBADO_NIVEL_1', 'APROBADO_NIVEL_2', 'APROBADO_NIVEL_3'].includes(estado) && !puente.ejecutadoEn;
  const canSubmit = estado === 'BORRADOR' && puente.creadoPor && user?.id === puente.creadoPorId;
  const canControl = canClose && ['JEFE_TURNO', 'JEFE_AREA', 'GERENTE', 'ADMIN'].includes(rol);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 font-mono">{puente.numeroRegistro}</h2>
            <EstadoBadge estado={puente.estado} />
            {puente.ejecutadoEn && <span className="badge-aprobado flex items-center gap-1"><Activity size={12} /> EJECUTADO</span>}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{puente.elementoAForzar} · {puente.equipo}</p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {canSubmit && <button onClick={() => submitMut.mutate()} className="btn-primary text-sm">Enviar para Aprobación</button>}
          {canApprove && <button onClick={() => setModal('approve')} className="btn-success text-sm flex items-center gap-1"><CheckCircle size={14} /> Aprobar</button>}
          {canApprove && <button onClick={() => setModal('reject')} className="btn-danger text-sm flex items-center gap-1"><XCircle size={14} /> Rechazar</button>}
          {canActivate && <button onClick={() => activateMut.mutate()} className="btn-primary text-sm flex items-center gap-1"><Activity size={14} /> Marcar Ejecutado</button>}
          {canRenew && <button onClick={() => setModal('renew')} className="btn-secondary text-sm flex items-center gap-1"><RefreshCw size={14} /> Renovar</button>}
          {canClose && <button onClick={() => setModal('close')} className="btn-secondary text-sm flex items-center gap-1"><Lock size={14} /> Cerrar</button>}
          {canControl && <button onClick={() => setModal('control')} className="btn-secondary text-sm flex items-center gap-1"><MessageSquare size={14} /> Control</button>}
          <button onClick={() => pdfMut.mutate()} disabled={pdfMut.isPending} className="btn-secondary text-sm flex items-center gap-1"><FileText size={14} /> PDF</button>
        </div>
      </div>

      {/* Info principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Información del Puente</h3>
          <Field label="Tipo" value={puente.tipo} />
          <Field label="Elemento a Forzar" value={puente.elementoAForzar} />
          <Field label="Equipo" value={puente.equipo} />
          <Field label="Solicitante" value={`${puente.creadoPor.nombre} ${puente.creadoPor.apellido} (${puente.creadoPor.area})`} />
          <Field label="Creado" value={format(new Date(puente.creadoEn), 'dd/MM/yyyy HH:mm')} />
          {puente.ejecutadoEn && <Field label="Ejecutado" value={format(new Date(puente.ejecutadoEn), 'dd/MM/yyyy HH:mm')} />}
          {puente.cerradoEn && <Field label="Cerrado" value={format(new Date(puente.cerradoEn), 'dd/MM/yyyy HH:mm')} />}
          {puente.proximaRenovacion && <Field label="Próx. Renovación" value={format(new Date(puente.proximaRenovacion), 'dd/MM/yyyy')} highlight={new Date(puente.proximaRenovacion) < new Date()} />}
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Análisis de Riesgos</h3>
          <Field label="Necesidad / Motivo" value={puente.necesidadMotivo} multiline />
          {puente.riesgosIdentificados && <Field label="Riesgos" value={puente.riesgosIdentificados} multiline />}
          {puente.variablesControl && <Field label="Variables Control" value={puente.variablesControl} multiline />}
          {puente.medidasContencion && <Field label="Medidas de Contención" value={puente.medidasContencion} multiline />}
        </div>
      </div>

      {/* Aprobaciones */}
      {puente.aprobaciones?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Historial de Aprobaciones</h3>
          <div className="space-y-3">
            {puente.aprobaciones.map((ap: { id: string; nivel: number; estado: string; aprobador: { nombre: string; apellido: string }; fecha: string; comentarios?: string }) => (
              <div key={ap.id} className={`flex items-start gap-3 p-3 rounded-lg ${ap.estado === 'APROBADO' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${ap.estado === 'APROBADO' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {ap.nivel}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{ap.aprobador.nombre} {ap.aprobador.apellido} — <span className={ap.estado === 'APROBADO' ? 'text-green-700' : 'text-red-700'}>{ap.estado}</span></p>
                  {ap.comentarios && <p className="text-sm text-gray-600 mt-0.5">"{ap.comentarios}"</p>}
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(ap.fecha), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800">
              {modal === 'approve' && '✅ Aprobar Puente'}
              {modal === 'reject' && '❌ Rechazar Puente'}
              {modal === 'close' && '🔒 Cerrar / Normalizar'}
              {modal === 'renew' && '🔄 Renovar Puente'}
              {modal === 'control' && '📋 Registrar Control'}
            </h3>
            {modal === 'control' && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">¿Sigue siendo necesario?</span>
                <button onClick={() => setSigueNecesario(!sigueNecesario)} className={`px-3 py-1 rounded-full text-xs font-medium ${sigueNecesario ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {sigueNecesario ? 'SÍ' : 'NO'}
                </button>
              </div>
            )}
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              className="input-field"
              rows={3}
              placeholder={modal === 'reject' ? 'Motivo de rechazo (requerido)...' : 'Observaciones (opcional)...'}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setModal(null); setComentario(''); }} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => {
                  if (modal === 'approve') approveMut.mutate();
                  if (modal === 'reject') { if (!comentario) { toast.error('Motivo requerido'); return; } rejectMut.mutate(); }
                  if (modal === 'close') closeMut.mutate();
                  if (modal === 'renew') renewMut.mutate();
                  if (modal === 'control') controlMut.mutate();
                }}
                className={modal === 'reject' ? 'btn-danger' : 'btn-primary'}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, multiline = false, highlight = false }: { label: string; value: string; multiline?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-sm mt-0.5 ${multiline ? 'whitespace-pre-wrap' : ''} ${highlight ? 'text-red-600 font-medium' : 'text-gray-800'}`}>{value || '—'}</p>
    </div>
  );
}
