import React, { useState, useEffect } from 'react';  
import { motion } from 'framer-motion';  
import { supabase } from '../utils/supabase';  
import { Plus, Search, Filter, Calendar, AlertTriangle, Edit, Trash2, Check, FileText } from 'lucide-react';  
import FollowupForm from './FollowupForm';  

const FollowupList = () => {  
  const [followups, setFollowups] = useState([]);  
  const [showAddForm, setShowAddForm] = useState(false);  
  const [filterStatus, setFilterStatus] = useState('todos');  
  const [searchTerm, setSearchTerm] = useState('');  
  const [loading, setLoading] = useState(true);  

  useEffect(() => {  
    fetchFollowups();  
  }, []);  

  const fetchFollowups = async () => {  
    setLoading(true);  
    let query = supabase  
      .from('cobranza_followups')  
      .select(`  
        *,  
        clients!inner(  
          id,  
          name,  
          customer_number,  
          zone  
        )  
      `)  
      .order('created_at', { ascending: false });  

    if (filterStatus !== 'todos') {  
      query = query.eq('status', filterStatus);  
    }  

    const { data, error } = await query;  
    if (error) {  
      alert('Error al cargar seguimientos: ' + error.message);  
      console.error(error);  
    } else {  
      setFollowups(data || []);  
    }  
    setLoading(false);  
  };  

  const handleDelete = async (id) => {  
    if (window.confirm('¿Eliminar este seguimiento?')) {  
      const { error } = await supabase.from('cobranza_followups').delete().eq('id', id);  
      if (error) {  
        alert('Error: ' + error.message);  
        console.error(error);  
      } else {  
        fetchFollowups();  
      }  
    }  
  };  

  const editFollowup = (followupId) => {  
    // Abrir form en modo editar  
    setShowAddForm(true);  
    // Nota: El form maneja existingFollowupId si se pasa, pero por ahora simular - implementación pendiente para global edit  
    alert(`Redirigir a editar seguimiento ${followupId} - Ajustar para ClientDetails`);  
  };  

  const filteredFollowups = followups.filter(f => {  
    const clientName = f.clients?.name?.toLowerCase() || '';  
    const month = f.service_month.toLowerCase();  
    const status = f.status.toLowerCase();  
    const searchLower = searchTerm.toLowerCase();  
    return clientName.includes(searchLower) || month.includes(searchLower) || status.includes(searchLower);  
  });  

  const getStatusColor = (status, isPaid = false) => {  
    if (isPaid) {  
      return 'bg-green-100 text-green-800'; // Cerrado/pagado  
    }  
    switch (status) {  
      case 'contactado': return 'bg-yellow-100 text-yellow-800';  
      case 'pedido': return 'bg-blue-100 text-blue-800';  
      case 'en_espera': return 'bg-orange-100 text-orange-800';  
      case 'facturado': return 'bg-green-100 text-green-800';  
      case 'pagado': return 'bg-green-100 text-green-800';  
      default: return 'bg-gray-100 text-gray-800';  
    }  
  };  

  const getStatusLabel = (status, paymentDate) => {  
    if (paymentDate) {  
      return 'Pagado (Cerrado)';  
    }  
    switch (status) {  
      case 'contactado': return 'Contactado';  
      case 'pedido': return 'Pedido';  
      case 'en_espera': return 'En Espera';  
      case 'facturado': return 'Facturado';  
      case 'pagado': return 'Pagado';  
      default: return status;  
    }  
  };  

  const statusOptions = [  
    { value: 'todos', label: 'Todos' },  
    { value: 'contactado', label: 'Contactado' },  
    { value: 'pedido', label: 'Pedido' },  
    { value: 'en_espera', label: 'En Espera' },  
    { value: 'facturado', label: 'Facturado' },  
    { value: 'pagado', label: 'Pagados' }  
  ];  

  if (loading) {  
    return (  
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">  
        <motion.div className="p-8 bg-white rounded-3xl shadow-xl">Cargando seguimientos...  
        </motion.div>  
      </div>  
    );  
  }  

  return (  
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">  
      <div className="container mx-auto px-4 py-8">  
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">  
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Seguimientos de Cobranza</h1>  
          <p className="text-xl text-gray-600">Rastrea todos los cobros mensuales. Usa folio para facturación y marca como pagado para cerrar.</p>  
        </motion.div>  

        <motion.div whileHover={{ scale: 1.02 }} className="mb-8">  
          <button  
            onClick={() => setShowAddForm(true)}  
            className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl font-semibold shadow-lg hover:shadow-xl transition-all"  
          >  
            <Plus className="w-5 h-5" /> Nuevo Seguimiento  
          </button>  
        </motion.div>  

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-gray-200/50">  
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">  
            <div className="flex items-center gap-2 flex-1 max-w-md">  
              <Search className="w-4 h-4 text-gray-500" />  
              <input  
                type="text"  
                placeholder="Buscar por cliente, mes, folio o status..."  
                value={searchTerm}  
                onChange={(e) => setSearchTerm(e.target.value)}  
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"  
              />  
            </div>  
            <div className="flex items-center gap-2">  
              <Filter className="w-4 h-4 text-gray-500" />  
              <select  
                value={filterStatus}  
                onChange={(e) => {  
                  setFilterStatus(e.target.value);  
                  fetchFollowups();  
                }}  
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"  
              >  
                {statusOptions.map(opt => (  
                  <option key={opt.value} value={opt.value}>{opt.label}</option>  
                ))}  
              </select>  
            </div>  
          </div>  
        </div>  

        {filteredFollowups.length === 0 ? (  
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">  
            <AlertTriangle className="w-24 h-24 text-gray-300 mx-auto mb-6" />  
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay seguimientos</h2>  
            <p className="text-gray-600">Filtra o agrega uno nuevo para empezar el seguimiento. Usa folio para numerar facturas.</p>  
          </motion.div>  
        ) : (  
          <div className="space-y-6">  
            {filteredFollowups.map((followup) => (  
              <motion.div  
                key={followup.id}  
                initial={{ opacity: 0, x: -20 }}  
                animate={{ opacity: 1, x: 0 }}  
                className={`rounded-3xl p-6 shadow-lg border hover:shadow-xl transition-all ${  
                  followup.payment_date ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'  
                }`}  
              >  
                <div className="flex items-start justify-between gap-4">  
                  <div className="flex-1">  
                    <div className="flex items-center gap-3 mb-3">  
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${  
                        getStatusColor(followup.status || 'facturado', !!followup.payment_date)  
                      }`}>  
                        {getStatusLabel(followup.status || 'facturado', followup.payment_date)}  
                      </span>  
                      <h3 className="text-lg font-semibold text-gray-900">{followup.service_month}</h3>  
                    </div>  
                    {followup.clients && (  
                      <div className="bg-gray-50 rounded-2xl p-4 mb-3">  
                        <h4 className="font-medium text-gray-900 mb-1">Cliente: {followup.clients.name}</h4>  
                        <p className="text-sm text-gray-600">#{followup.clients.customer_number} • {followup.clients.zone}</p>  
                      </div>  
                    )}  
                    {followup.observations && (  
                      <p className="text-gray-600 text-sm mb-3 italic">"{followup.observations}"</p>  
                    )}  
                    <div className="flex flex-wrap gap-4 text-xs">  
                      {followup.invoice_folio && (  
                        <span className="font-medium text-gray-800 flex items-center gap-1">  
                          <FileText className="w-3 h-3" /> Folio: {followup.invoice_folio}  
                        </span>  
                      )}  
                      {followup.billing_date && <span className="flex items-center gap-1 text-gray-600">  
                        Fact: {new Date(followup.billing_date).toLocaleDateString()}  
                      </span>}  
                      {followup.payment_date ? (  
                        <span className="flex items-center gap-1 text-green-600 font-medium">  
                          <Check className="w-3 h-3" /> Cerrado: Pagado {new Date(followup.payment_date).toLocaleDateString()}  
                        </span>  
                      ) : (  
                        <span className="flex items-center gap-1 text-red-600">  
                          <AlertTriangle className="w-3 h-3" /> Pendiente  
                        </span>  
                      )}  
                      {followup.registered_in_program && <span className="flex items-center gap-1 text-green-600">  
                        ✓ Registrado  
                      </span>}  
                    </div>  
                  </div>  
                  <div className="flex flex-col gap-2">  
                    {followup.payment_date ? (  
                      <span className="p-2 text-green-600 rounded-full bg-green-100">✓</span>  
                    ) : (  
                      <motion.button  
                        onClick={() => editFollowup(followup.id)}  
                        whileHover={{ scale: 1.05 }}  
                        className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-all"  
                      >  
                        <Edit className="w-4 h-4" />  
                      </motion.button>  
                    )}  
                    <button  
                      onClick={() => handleDelete(followup.id)}  
                      className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-all"  
                      disabled={!!followup.payment_date}  
                    >  
                      <Trash2 className="w-4 h-4" />  
                    </button>  
                  </div>  
                </div>  
              </motion.div>  
            ))}  
          </div>  
        )}  

        {showAddForm && (  
          <FollowupForm  
            clientId={null}  
            existingFollowupId={null}  
            onClose={() => {  
              setShowAddForm(false);  
              fetchFollowups();  
            }}  
          />  
        )}  
      </div>  
    </div>  
  );  
};  

export default FollowupList;