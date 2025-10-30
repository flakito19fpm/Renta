import React, { useState, useEffect } from 'react';  
import { motion } from 'framer-motion';  
import { useParams, useNavigate } from 'react-router-dom';  
import { supabase } from '../utils/supabase';  
import { Users, MapPin, Key, Coffee, Calendar, AlertCircle, CheckCircle2, Edit, Trash2, LayoutDashboard, Plus, FileText, Phone } from 'lucide-react';  
import FollowupForm from './FollowupForm';  
import AddClientForm from './AddClientForm';  

const ClientDetails = () => {  
  const { id } = useParams();  
  const navigate = useNavigate();  
  const [client, setClient] = useState(null);  
  const [followups, setFollowups] = useState([]);  
  const [showFollowupForm, setShowFollowupForm] = useState(false);  
  const [editingFollowupId, setEditingFollowupId] = useState(null);  
  const [showEditClientForm, setShowEditClientForm] = useState(false);  
  const [loading, setLoading] = useState(true);  

  useEffect(() => {  
    fetchClient();  
    fetchFollowups();  
  }, [id]);  

  const fetchClient = async () => {  
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();  
    if (error) {  
      alert('Error al cargar cliente: ' + error.message);  
    } else {  
      setClient(data);  
    }  
    setLoading(false);  
  };  

  const fetchFollowups = async () => {  
    const { data, error } = await supabase  
      .from('cobranza_followups')  
      .select('*')  
      .eq('client_id', id)  
      .order('service_month', { ascending: false });  
    if (error) {  
      alert('Error al cargar seguimientos: ' + error.message);  
    } else {  
      setFollowups(data || []);  
    }  
  };  

  const handleClientEditSuccess = () => {  
    fetchClient();  
  };  

  const deleteFollowup = async (followupId) => {  
    if (window.confirm('¿Seguro que quieres eliminar este seguimiento?')) {  
      const { error } = await supabase.from('cobranza_followups').delete().eq('id', followupId);  
      if (error) {  
        alert('Error al eliminar: ' + error.message);  
      } else {  
        fetchFollowups();  
      }  
    }  
  };  

  const editFollowup = (followupId) => {  
    setEditingFollowupId(followupId);  
    setShowFollowupForm(true);  
  };  

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

  if (loading) {  
    return (  
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">  
        <motion.div className="p-8 bg-white rounded-3xl shadow-xl">Cargando...  
        </motion.div>  
      </div>  
    );  
  }  

  if (!client) {  
    return <div>Cliente no encontrado. ¡Ups!</div>;  
  }  

  if (showEditClientForm) {  
    return (  
      <AddClientForm  
        clientToEdit={client}  
        onClose={() => {  
          setShowEditClientForm(false);  
          fetchClient();  
        }}  
        onSuccess={handleClientEditSuccess}  
      />  
    );  
  }  

  return (  
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">  
      <div className="container mx-auto px-4 py-8">  
        <motion.button  
          onClick={() => navigate(-1)}  
          whileHover={{ scale: 0.98 }}  
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200"  
        >  
          <AlertCircle className="w-4 h-4" /> Volver  
        </motion.button>  
        <motion.div  
          initial={{ opacity: 0, y: 20 }}  
          animate={{ opacity: 1, y: 0 }}  
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl mb-8 border border-gray-200/50 relative"  
        >  
          <div className="flex items-center justify-between mb-6">  
            <div className="flex items-start gap-6">  
              <div className="flex-shrink-0 p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">  
                <Users className="w-8 h-8 text-white" />  
              </div>  
              <div className="flex-1">  
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{client.name}</h1>  
                <p className="text-xl text-gray-600 mb-2">#{client.customer_number} • {client.zone}</p>  
                {client.phone && <p className="text-lg text-gray-700 mb-6"><Phone className="w-5 h-5 inline -ml-1 mr-2" />{client.phone}</p>}  
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">  
                  <div className="flex items-center gap-2">  
                    <Key className="w-4 h-4 text-gray-500" /> {client.rental_key}  
                  </div>  
                  <div className="flex items-center gap-2">  
                    <Coffee className="w-4 h-4 text-gray-500" />  
                    {client.service_type.toUpperCase()} • {client.kilos}kg {client.coffee_type}  
                  </div>  
                  <div className="flex items-center gap-2">  
                    <Calendar className="w-4 h-4 text-gray-500" /> Cierre: {client.cutoff_day} • ${client.service_value_with_coffee?.toLocaleString()}  
                  </div>  
                </div>  
              </div>  
            </div>  
            <motion.button  
              onClick={() => setShowEditClientForm(true)}  
              whileHover={{ scale: 1.05 }}  
              className="p-3 text-amber-500 hover:text-amber-700 bg-amber-100 rounded-2xl hover:bg-amber-200 transition-all"  
            >  
              <Edit className="w-5 h-5" />  
            </motion.button>  
          </div>  
        </motion.div>  

        <motion.div  
          initial={{ opacity: 0, y: 20 }}  
          animate={{ opacity: 1, y: 0 }}  
          transition={{ delay: 0.2 }}  
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200/50"  
        >  
          <div className="flex items-center justify-between mb-6">  
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">  
              <LayoutDashboard className="w-6 h-6" />  
              Seguimientos de Cobranza  
            </h2>  
            <motion.button  
              onClick={() => { setEditingFollowupId(null); setShowFollowupForm(true); }}  
              whileHover={{ scale: 1.05 }}  
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"  
            >  
              <Plus className="w-4 h-4" />  
              Nuevo/Actualizar  
            </motion.button>  
          </div>  

          {followups.length === 0 ? (  
            <motion.div  
              initial={{ opacity: 0, scale: 0.95 }}  
              animate={{ opacity: 1, scale: 1 }}  
              className="text-center py-12"  
            >  
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />  
              <p className="text-gray-500">No hay seguimientos aún. ¡Agrega el primero!</p>  
            </motion.div>  
          ) : (  
            <div className="space-y-4">  
              {followups.map((followup) => (  
                <motion.div  
                  key={followup.id}  
                  initial={{ opacity: 0, x: -20 }}  
                  animate={{ opacity: 1, x: 0 }}  
                  className={`bg-white rounded-2xl p-6 border shadow-sm ${  
                    followup.payment_date ? 'border-green-200 bg-green-50' : 'border-gray-200'  
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
                        <h3 className="font-semibold text-gray-900">{followup.service_month}</h3>  
                      </div>  
                      {followup.observations && (  
                        <p className="text-gray-600 text-sm mb-3">{followup.observations}</p>  
                      )}  
                      <div className="flex items-center gap-4 text-xs">  
                        {followup.invoice_folio && (  
                          <span className="font-medium text-gray-800 flex items-center gap-1">  
                            <FileText className="w-3 h-3" /> Folio: {followup.invoice_folio}  
                          </span>  
                        )}  
                        {followup.billing_date && <span className="flex items-center gap-1 text-gray-600">  
                          <FileText className="w-3 h-3" /> Facturado: {new Date(followup.billing_date).toLocaleDateString()}  
                        </span>}  
                        {followup.payment_date ? (  
                          <span className="flex items-center gap-1 text-green-600 font-medium">  
                            <CheckCircle2 className="w-3 h-3" /> Cerrado: Pagado el {new Date(followup.payment_date).toLocaleDateString()}  
                          </span>  
                        ) : (  
                          <span className="flex items-center gap-1 text-gray-500">  
                            Pendiente  
                          </span>  
                        )}  
                        {followup.registered_in_program && (  
                          <span className="flex items-center gap-1 text-green-600">  
                            <CheckCircle2 className="w-3 h-3" /> Registrado  
                          </span>  
                        )}  
                      </div>  
                    </div>  
                    <div className="flex items-center gap-2">  
                      {followup.payment_date ? null : ( // No editar si ya pagado  
                        <motion.button  
                          onClick={() => editFollowup(followup.id)}  
                          whileHover={{ scale: 1.05 }}  
                          className="p-2 text-amber-500 hover:text-amber-700 rounded-full hover:bg-amber-50 transition-all"  
                        >  
                          <Edit className="w-4 h-4" />  
                        </motion.button>  
                      )}  
                      <button  
                        onClick={() => deleteFollowup(followup.id)}  
                        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-all"  
                        disabled={!!followup.payment_date} // No borrar si pagado  
                      >  
                        <Trash2 className="w-4 h-4" />  
                      </button>  
                    </div>  
                  </div>  
                </motion.div>  
              ))}  
            </div>  
          )}  
        </motion.div>  

        {showFollowupForm && (  
          <FollowupForm  
            clientId={id}  
            existingFollowupId={editingFollowupId}  
            onClose={() => {  
              setShowFollowupForm(false);  
              setEditingFollowupId(null);  
              fetchFollowups();  
            }}  
          />  
        )}  
      </div>  
    </div>  
  );  
};  

export default ClientDetails;