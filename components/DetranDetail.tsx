import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DetranData, DocumentItem, RegistrationStatus, StatusHistoryItem } from '../types';
import { getDetranData, updateDetran, checkExpirationStatus, getUser } from '../services/storageService';
import { STATUS_OPTIONS, STATUS_STYLES, INSTITUTION_NAME } from '../constants';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, Plus, Trash2, Calendar, AlertTriangle, 
  FileText, Phone, User as UserIcon, Mail, History, CheckCircle, Flag, Download, Edit2, X, Save
} from 'lucide-react';

const getProgress = (status: RegistrationStatus): number => {
  switch (status) {
    case 'Recadastrado com Sucesso':
      return 100;
    case 'Concluída':
      return 90;
    case 'Pendente':
      return 75;
    case 'Em Andamento':
      return 50;
    case 'Iniciada':
      return 25;
    case 'Não Iniciada':
    default:
      return 0;
  }
};

const DetranDetail: React.FC = () => {
  const { uf } = useParams<{ uf: string }>();
  const navigate = useNavigate();
  const [detran, setDetran] = useState<DetranData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Permission Check
  const currentUser = getUser();
  const isViewer = currentUser?.role === 'VIEWER';
  
  // UI Control States
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Form states
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isCritical, setIsCritical] = useState(false);

  // Feedback states
  const [configSuccess, setConfigSuccess] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');

  useEffect(() => {
    // Garante que a página comece do topo ao carregar
    window.scrollTo(0, 0);
    loadData();
  }, [uf, navigate]);

  const loadData = () => {
    if (uf) {
      const allData = getDetranData();
      const found = allData.find(d => d.uf === uf);
      if (found) {
        setDetran(found);
        setIsCritical(checkExpirationStatus(found));
      } else {
        navigate('/detrans');
      }
      setLoading(false);
    }
  };

  // --- Handlers para Configuração (Prazos) ---

  const handleSaveConfig = () => {
    if (!detran || isViewer) return;
    
    const user = getUser();
    const metadata = {
        lastUpdated: new Date().toISOString(),
        user: user?.username || 'Desconhecido'
    };

    updateDetran(detran.uf, { 
       expirationDate: detran.expirationDate,
       alertDays: detran.alertDays,
       configMetadata: metadata
    });

    // Update local state with metadata
    const updatedDetran = { ...detran, configMetadata: metadata };
    setDetran(updatedDetran);
    
    // Re-check critical status
    setIsCritical(checkExpirationStatus(updatedDetran));
    
    setIsEditingConfig(false);
    setConfigSuccess('Dados atualizados');
    setTimeout(() => setConfigSuccess(''), 2000);
  };

  const handleCancelConfig = () => {
    setIsEditingConfig(false);
    loadData(); // Revert changes by reloading from storage
  };

  // --- Handlers para Contatos ---

  const handleSaveContact = () => {
    if (!detran || isViewer) return;

    const user = getUser();
    const metadata = {
        lastUpdated: new Date().toISOString(),
        user: user?.username || 'Desconhecido'
    };

    updateDetran(detran.uf, { 
       contact: detran.contact,
       contactMetadata: metadata
    });

    // Update local state
    setDetran({ ...detran, contactMetadata: metadata });

    setIsEditingContact(false);
    setContactSuccess('Dados de contato salvos');
    setTimeout(() => setContactSuccess(''), 2000);
  };

  const handleCancelContact = () => {
    setIsEditingContact(false);
    loadData(); // Revert changes
  };

  // --- Handlers Gerais ---

  const handleAddDocument = () => {
    if (!detran || !newDocDescription.trim() || isViewer) return;
    
    const newDoc: DocumentItem = {
      id: crypto.randomUUID(),
      description: newDocDescription,
      lastUpdated: new Date().toISOString(),
      isCompliant: false // Inicia como não entregue (vermelho)
    };

    const updatedDocs = [...detran.documents, newDoc];
    setDetran({ ...detran, documents: updatedDocs });
    updateDetran(detran.uf, { documents: updatedDocs });
    setNewDocDescription('');
  };

  const handleToggleDocument = (id: string) => {
    if (!detran || isViewer) return;
    
    const updatedDocs = detran.documents.map(doc => {
        if (doc.id === id) {
            return { 
                ...doc, 
                isCompliant: !doc.isCompliant,
                lastUpdated: new Date().toISOString() // Atualiza data ao mudar status
            };
        }
        return doc;
    });

    setDetran({ ...detran, documents: updatedDocs });
    updateDetran(detran.uf, { documents: updatedDocs });
  };

  const handleDeleteDocument = (id: string) => {
    if (!detran || isViewer) return;
    const updatedDocs = detran.documents.filter(d => d.id !== id);
    setDetran({ ...detran, documents: updatedDocs });
    updateDetran(detran.uf, { documents: updatedDocs });
  };

  const handleStatusChange = (newStatus: RegistrationStatus) => {
    if (!detran || isViewer) return;
    
    // Atualiza apenas o status atual visualmente e no banco, 
    // MAS NÃO GERA LINHA DO TEMPO AINDA.
    setDetran({ 
      ...detran, 
      currentStatus: newStatus 
    });
    
    updateDetran(detran.uf, { 
      currentStatus: newStatus 
    });
  };

  const handleSaveObservation = () => {
    if (!detran || isViewer) return;
    
    // Só salva se houver texto na observação
    if (!newNote.trim()) return;

    const currentUser = getUser();
    
    // Cria o item do histórico usando o status que está selecionado atualmente no dropdown
    const newHistoryItem: StatusHistoryItem = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      status: detran.currentStatus,
      notes: newNote,
      user: currentUser?.username || 'Sistema'
    };

    const updatedHistory = [newHistoryItem, ...detran.statusHistory];
    
    setDetran({ 
      ...detran, 
      statusHistory: updatedHistory 
    });
    
    updateDetran(detran.uf, { 
      statusHistory: updatedHistory 
    });
    
    setNewNote('');
    setStatusSuccess('Observação salva com sucesso');
    setTimeout(() => setStatusSuccess(''), 3000);
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveObservation();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!detran) return;
    
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    let formatted = value;
    if (value.length > 10) {
      // (11) 91234-5678
      formatted = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 5) {
      // (11) 1234-5678
      formatted = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      // (11) 1234
      formatted = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (value.length > 0) {
      // (11
      formatted = value.replace(/^(\d*)/, '($1');
    }
    
    setDetran({ ...detran, contact: { ...detran.contact, phone: formatted } });
  };

  const handleExportExcel = () => {
    if (!detran) return;

    // Criar Workbook
    const wb = XLSX.utils.book_new();

    // Obter o último item do histórico para o resumo
    const lastUpdate = detran.statusHistory.length > 0 ? detran.statusHistory[0] : null;

    // --- ABA 1: DADOS GERAIS E CONTATOS ---
    const dadosGerais = [
      ["Relatório de Recadastramento", INSTITUTION_NAME],
      ["Data de Emissão", new Date().toLocaleString()],
      [],
      ["ESTADO", detran.stateName],
      ["UF", detran.uf],
      ["STATUS ATUAL", detran.currentStatus],
      [],
      ["--- PRAZOS E VENCIMENTOS ---"],
      ["Data de Vencimento", detran.expirationDate ? new Date(detran.expirationDate).toLocaleDateString() : 'Não definido'],
      ["Alerta (dias antes)", detran.alertDays],
      ["Última Alteração Prazos", detran.configMetadata ? `${new Date(detran.configMetadata.lastUpdated).toLocaleString()} por ${detran.configMetadata.user}` : '-'],
      [],
      ["--- CONTATOS DO DETRAN ---"],
      ["Nome do Contato", detran.contact.name || '-'],
      ["Telefone", detran.contact.phone || '-'],
      ["E-mail", detran.contact.email || '-'],
      ["Última Alteração Contatos", detran.contactMetadata ? `${new Date(detran.contactMetadata.lastUpdated).toLocaleString()} por ${detran.contactMetadata.user}` : '-'],
      [],
      ["--- ÚLTIMA OBSERVAÇÃO REGISTRADA ---"],
      ["Data e Hora", lastUpdate ? new Date(lastUpdate.date).toLocaleString() : '-'],
      ["Usuário Responsável", lastUpdate ? (lastUpdate.user || 'Sistema') : '-'],
      ["Conteúdo da Observação", lastUpdate ? (lastUpdate.notes || '-') : '-']
    ];
    const wsGerais = XLSX.utils.aoa_to_sheet(dadosGerais);
    XLSX.utils.book_append_sheet(wb, wsGerais, "Dados Gerais");

    // --- ABA 2: DOCUMENTAÇÃO ---
    const headerDocs = [["Descrição do Documento", "Última Atualização", "Status"]];
    const rowsDocs = detran.documents.map(doc => [
      doc.description,
      new Date(doc.lastUpdated).toLocaleString(),
      doc.isCompliant ? "ENTREGUE / ATUALIZADO" : "PENDENTE"
    ]);
    const wsDocs = XLSX.utils.aoa_to_sheet([...headerDocs, ...rowsDocs]);
    XLSX.utils.book_append_sheet(wb, wsDocs, "Documentação");

    // --- ABA 3: LINHA DO TEMPO (HISTÓRICO COMPLETO) ---
    // Inclui colunas explícitas para Data, Hora, Status, Usuário e Observação
    const headerHist = [["Data", "Hora", "Fase / Status", "Usuário Responsável", "Observações / Detalhes"]];
    const rowsHist = detran.statusHistory.map(hist => {
      const dateObj = new Date(hist.date);
      return [
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString(),
        hist.status,
        hist.user || 'Sistema',
        hist.notes || '-'
      ];
    });
    const wsHist = XLSX.utils.aoa_to_sheet([...headerHist, ...rowsHist]);
    XLSX.utils.book_append_sheet(wb, wsHist, "Linha do Tempo");

    // Download do arquivo
    XLSX.writeFile(wb, `Recadastramento_Detran_${detran.uf}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading || !detran) return <div className="p-8 text-center text-slate-500">Carregando...</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button 
            onClick={() => navigate('/detrans')}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
            title="Voltar"
            >
            <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-blue-900">Detran {detran.uf} - {detran.stateName}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm px-3 py-1 rounded-full font-medium border shadow-sm
                        ${STATUS_STYLES[detran.currentStatus]}
                    `}>
                        {detran.currentStatus}
                    </span>
                    {isCritical && detran.currentStatus !== 'Concluída' && detran.currentStatus !== 'Recadastrado com Sucesso' && (
                        <span className="flex items-center gap-1 text-sm text-red-600 font-bold animate-pulse bg-red-50 px-2 rounded-full border border-red-200">
                            <AlertTriangle className="w-4 h-4" />
                            Iniciar Processo de Recadastramento
                        </span>
                    )}
                </div>
            </div>
        </div>

        <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 bg-white text-blue-900 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
            <Download className="w-4 h-4" />
            Exportar Dados
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings & Contacts */}
        <div className="space-y-6">
          
          {/* Vencimento & Alertas */}
          <section className={`bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden ${isCritical ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-900" />
                    Prazos e Vencimentos
                </h3>
                
                {/* Edit Controls Config (Only for non-viewers) */}
                {!isViewer && (
                    !isEditingConfig ? (
                        <button 
                            onClick={() => setIsEditingConfig(true)}
                            className="flex items-center gap-1 text-sm text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors font-medium"
                        >
                            <Edit2 className="w-4 h-4" /> Editar
                        </button>
                    ) : (
                         <div className="flex items-center gap-2">
                             <button 
                                onClick={handleCancelConfig}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                                title="Cancelar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                             <button 
                                onClick={handleSaveConfig}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Salvar"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                         </div>
                    )
                )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de Vencimento</label>
                <input 
                  type="date" 
                  disabled={!isEditingConfig}
                  value={detran.expirationDate ? detran.expirationDate.split('T')[0] : ''}
                  onChange={(e) => {
                      const newData = { ...detran, expirationDate: e.target.value ? new Date(e.target.value).toISOString() : null };
                      setDetran(newData);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors
                    ${isEditingConfig 
                        ? 'border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 bg-white' 
                        : 'border-transparent bg-slate-50 text-slate-600 cursor-not-allowed'
                    }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Alerta (dias antes)
                </label>
                <div className="relative">
                    <input 
                    type="number" 
                    disabled={!isEditingConfig}
                    value={detran.alertDays}
                    onChange={(e) => setDetran({ ...detran, alertDays: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors
                        ${isEditingConfig 
                            ? 'border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 bg-white' 
                            : 'border-transparent bg-slate-50 text-slate-600 cursor-not-allowed'
                        }`}
                    />
                    {!isEditingConfig && <span className="absolute right-3 top-2 text-slate-400 text-sm">dias</span>}
                </div>
              </div>

              {/* Metadata Footer Config */}
              <div className="pt-3 border-t border-slate-100 mt-2">
                {configSuccess ? (
                     <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium animate-pulse">
                        <CheckCircle className="w-3 h-3" /> {configSuccess}
                    </div>
                ) : (
                    <p className="text-xs text-slate-400">
                        {detran.configMetadata ? (
                            <>Última alteração: {new Date(detran.configMetadata.lastUpdated).toLocaleDateString()} às {new Date(detran.configMetadata.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} por <strong>{detran.configMetadata.user}</strong></>
                        ) : (
                            'Nenhuma alteração registrada.'
                        )}
                    </p>
                )}
              </div>
            </div>
          </section>

          {/* Dados de Contato */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-900" />
                    Contatos do Detran
                </h3>
                
                {/* Edit Controls Contact (Only for non-viewers) */}
                 {!isViewer && (
                     !isEditingContact ? (
                        <button 
                            onClick={() => setIsEditingContact(true)}
                            className="flex items-center gap-1 text-sm text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors font-medium"
                        >
                            <Edit2 className="w-4 h-4" /> Editar
                        </button>
                    ) : (
                         <div className="flex items-center gap-2">
                             <button 
                                onClick={handleCancelContact}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                                title="Cancelar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                             <button 
                                onClick={handleSaveContact}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Salvar"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                         </div>
                    )
                 )}
             </div>
            
            <div className="space-y-3">
               <div className="relative">
                   <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                   <input 
                        type="text" 
                        placeholder="Nome do Contato"
                        disabled={!isEditingContact}
                        value={detran.contact.name}
                        onChange={(e) => setDetran({ ...detran, contact: { ...detran.contact, name: e.target.value } })}
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none transition-colors
                            ${isEditingContact 
                                ? 'border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 bg-white' 
                                : 'border-transparent bg-slate-50 text-slate-600 cursor-not-allowed'
                            }`}
                   />
               </div>
               <div className="relative">
                   <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                   <input 
                        type="text" 
                        placeholder="(00) 00000-0000"
                        disabled={!isEditingContact}
                        value={detran.contact.phone}
                        onChange={handlePhoneChange}
                        maxLength={15}
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none transition-colors
                            ${isEditingContact 
                                ? 'border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 bg-white' 
                                : 'border-transparent bg-slate-50 text-slate-600 cursor-not-allowed'
                            }`}
                   />
               </div>
               <div className="relative">
                   <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                   <input 
                        type="email" 
                        placeholder="Email"
                        disabled={!isEditingContact}
                        value={detran.contact.email}
                        onChange={(e) => setDetran({ ...detran, contact: { ...detran.contact, email: e.target.value } })}
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none transition-colors
                            ${isEditingContact 
                                ? 'border-slate-300 focus:ring-1 focus:ring-blue-900 focus:border-blue-900 bg-white' 
                                : 'border-transparent bg-slate-50 text-slate-600 cursor-not-allowed'
                            }`}
                   />
               </div>
            </div>

            {/* Metadata Footer Contact */}
             <div className="pt-3 border-t border-slate-100 mt-2">
                {contactSuccess ? (
                     <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium animate-pulse">
                        <CheckCircle className="w-3 h-3" /> {contactSuccess}
                    </div>
                ) : (
                    <p className="text-xs text-slate-400">
                        {detran.contactMetadata ? (
                            <>Última alteração: {new Date(detran.contactMetadata.lastUpdated).toLocaleDateString()} às {new Date(detran.contactMetadata.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} por <strong>{detran.contactMetadata.user}</strong></>
                        ) : (
                            'Nenhuma alteração registrada.'
                        )}
                    </p>
                )}
              </div>
          </section>
        </div>

        {/* Center & Right: Docs & Timeline */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Documentação */}
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-900" />
                    Documentação Obrigatória
                </h3>

                {/* Docs Input (Hidden for Viewer) */}
                {!isViewer && (
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text"
                            placeholder="Descreva o documento necessário (ex: Contrato Social atualizado)"
                            value={newDocDescription}
                            onChange={(e) => setNewDocDescription(e.target.value)}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none shadow-sm"
                        />
                        <button 
                            onClick={handleAddDocument}
                            className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 flex items-center gap-2 font-medium shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Adicionar
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    {detran.documents.length === 0 && (
                        <p className="text-center text-slate-400 py-4 italic">Nenhum documento cadastrado.</p>
                    )}
                    {detran.documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-3">
                                {/* Indicador Visual (Bolinha) */}
                                <div 
                                    className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-300 ${doc.isCompliant ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-red-500 shadow-sm shadow-red-200'}`} 
                                    title={doc.isCompliant ? "Documento Atualizado" : "Pendente/Desatualizado"}
                                />
                                
                                <div>
                                    <p className={`font-medium ${doc.isCompliant ? 'text-emerald-800' : 'text-slate-700'}`}>
                                        {doc.description}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Atualizado em: {new Date(doc.lastUpdated).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Actions (Hidden for Viewer) */}
                            {!isViewer && (
                                <div className="flex items-center gap-2">
                                    {/* Botão Flag */}
                                    <button
                                        onClick={() => handleToggleDocument(doc.id)}
                                        className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs font-medium border
                                            ${doc.isCompliant 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                                            }
                                        `}
                                        title={doc.isCompliant ? "Marcar como pendente" : "Marcar como atualizado"}
                                    >
                                        <Flag className={`w-4 h-4 ${doc.isCompliant ? 'fill-emerald-600' : ''}`} />
                                        {doc.isCompliant ? 'Atualizado' : 'Marcar'}
                                    </button>

                                    <button 
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="text-slate-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                                        title="Remover documento"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Linha do Tempo / Workflow */}
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-900" />
                    Linha do Tempo e Status
                </h3>

                {/* Status Changer (Hidden for Viewer) */}
                {!isViewer && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Atualizar Fase/Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                                onChange={(e) => handleStatusChange(e.target.value as RegistrationStatus)}
                                value={detran.currentStatus}
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                             <div className="relative">
                                 <input 
                                    type="text"
                                    placeholder="Observação para esta fase... (Enter para salvar)"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyDown={handleNoteKeyDown}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none"
                                />
                            </div>
                        </div>
                        {statusSuccess && (
                             <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm font-medium animate-pulse">
                                <CheckCircle className="w-4 h-4" /> {statusSuccess}
                            </div>
                        )}
                    </div>
                )}

                {/* Timeline Visual */}
                <div className="relative border-l-2 border-slate-300 ml-3 space-y-8 pl-8 py-2">
                    {detran.statusHistory.map((item, index) => {
                        const progress = getProgress(item.status);
                        return (
                            <div key={item.id} className="relative">
                                {/* Dot */}
                                <span className={`absolute -left-[41px] top-1 h-5 w-5 rounded-full border-2 border-white 
                                    ${index === 0 ? 'bg-blue-900 ring-4 ring-slate-200' : 'bg-slate-400'}
                                `}></span>
                                
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                    <div>
                                        <p className={`font-semibold ${index === 0 ? 'text-blue-900' : 'text-slate-600'} flex items-center gap-2`}>
                                            {item.status}
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border
                                                ${progress === 100 
                                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }
                                            `}>
                                                {progress}%
                                            </span>
                                        </p>
                                        {item.notes && (
                                            <p className="text-sm text-slate-500 mt-1">{item.notes}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                        {new Date(item.date).toLocaleString()}
                                        {item.user && <span className="font-semibold text-blue-900 ml-1"> - {item.user}</span>}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default DetranDetail;