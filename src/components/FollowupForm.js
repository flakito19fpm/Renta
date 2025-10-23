import React, { useState, useEffect } from 'react';  
import { motion } from 'framer-motion';  
import { X, Calendar, AlertTriangle, FileText, Check, Users, Search } from 'lucide-react';  
import { supabase } from '../utils/supabase';  

const FollowupForm = ({ clientId, onClose, existingFollowupId = null }) => {  
  const [formData, setFormData] = useState({  
    service_month: new Date().toISOString().slice(0, 7),  
    status: 'contactado',  
    billing_date: '',  
    invoice_folio: '',  
    payment_date: '',  
    registered_in_program: false,  
    observations: ''  
  });  
  const [clients, setClients] = useState([]);  
  const [selectedClient, setSelectedClient] = useState(clientId || '');  
  const [loading, setLoading] = useState(false);  
  const [existingFollowup, setExistingFollowup] = useState(null);  

  useEffect(() => {  
    fetchClients();  
    if (clientId) {  
      setSelectedClient(clientId);  
    }  
    if (existingFollowupId) {  
      loadExistingFollowup(existingFollowupId);  
    }  
  }, [clientId, existingFollowupId]);  

  const fetchClients = async () => {  
    const { data } = await supabase.from('clients').select('*').order('name');  
    setClients(data || []);  
  };  

  const loadExistingFollowup = async (id) => {  
    const { data } = await supabase.from('cobranza_followups').select('*').eq('id', id).single();  
    if (data) {  
      setFormData({  
        service_month: data.service_month,  
        status: data.payment_date ? 'pagado' : data.status, // Set 'pagado' si tiene fecha de pago  
        billing_date: data.billing_date ? new Date(data.billing_date).toISOString().slice(0, 10) : '',  
        invoice_folio: data.invoice_folio || '',  
        payment_date: data.payment_date ? new Date(data.payment_date).toISOString().slice(0, 10) : '',  
        registered_in_program: data.registered_in_program || false,  
        observations: data.observations || ''  
      });  
      setExistingFollowup(data);  
    }  
  };  

  const handleChange = (e) => {  
    const { name, value, type, checked } = e.target;  
    let newData = { ...formData, [name]: type === 'checkbox' ? checked : value };  

    // Lógica auto: si payment_date se llena, set status a 'pagado'  
    if (name === 'payment_date' && value && value !== '') {  
      newData.status = 'pagado';  
    } else if (name === 'payment_date' && !value) {  
      // Si se borra payment_date, volver a status original o 'facturado'  
      if (existingFollowupId) {  
        newData.status = existingFollowup || 'facturado';  
      }  
    }  

    setFormData(newData);  
  };  

  const handleSubmit = async (e) => {  
    e.preventDefault();  
    if (!selectedClient) {  
      alert('Selecciona un cliente');  
      return;  
    }  
    setLoading(true);  
    try {  
      let payload = { ...formData, client_id: selectedClient };  
      // Auto-ajustar status si payment_date está lleno  
      if (payload.payment_date && payload.payment_date !== '') {  
        payload.status = 'pagado';  
      }  
      // Manejar fechas: si vacío, null; sino, ISO  
      if (payload.billing_date && payload.billing_date !== '') {  
        payload.billing_date = new Date(payload.billing_date).toISOString();  
      } else {  
        payload.billing_date = null;  
      }  
      if (payload.payment_date && payload.payment_date !== '') {  
        payload.payment_date = new Date(payload.payment_date).toISOString();  
      } else {  
        payload.payment_date = null;  
      }  

      let data, error;  
      if (existingFollowupId) {  
        // Modo editar: directo update  
        ({ data, error } = await supabase  
          .from('cobranza_followups')  
          .update(payload)  
          .eq('id', existingFollowupId));  
        console.log('Seguimiento editado.');  
      } else {  
        // Modo nuevo/upsert: chequear si existe por client_id + service_month  
        ({ data, error } = await supabase  
          .from('cobranza_followups')  
          .select('id')  
          .eq('client_id', selectedClient)  
          .eq('service_month', payload.service_month)  
          .single());  

        if (data && data.id) {  
          // Actualizar existente  
          ({ data, error } = await supabase  
            .from('cobranza_followups')  
            .update(payload)  
            .eq('id', data.id));  
          console.log('Seguimiento actualizado (upsert).');  
        } else if (error && error.code !== 'PGRST116') { // Ignorar "no rows" error  
          throw error;  
        } else {  
          // Crear nuevo  
          ({ data, error } = await supabase  
            .from('cobranza_followups')  
            .insert([payload]));  
          console.log('Nuevo seguimiento creado.');  
        }  
      }  

      if (error) {  
        console.error('Error en operación:', error);  
        throw new Error(error.message || 'Error desconocido al guardar');  
      }  
      onClose();  
    } catch (err) {  
      console.error('Error completo en handleSubmit:', err);  
      alert('Error al guardar: ' + err.message);  
    } finally {  
      setLoading(false);  
    }  
  };  

  return (  
    <motion.div  
      initial={{ opacity: 0, scale: 0.95 }}  
      animate={{ opacity: 1, scale: 1 }}  
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"  
      onClick={onClose}  
    >  
      <motion.div  
        initial={{ y: 50, opacity: 0 }}  
        animate={{ y: 0, opacity: 1 }}  
        className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200/50"  
        onClick={(e) => e.stopPropagation()}  
      >  
        <div className="flex items-center justify-between mb-6">  
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">  
            <Calendar className="w-6 h-6 text-blue-600" />  
            {existingFollowupId ? 'Editar' : (clientId ? 'Actualizar' : 'Nuevo')} Seguimiento  
          </h2>  
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">  
            <X className="w-5 h-5 text-gray-500" />  
          </button>  
        </div>  
        <form onSubmit={handleSubmit} className="space-y-6">  
          {!clientId && !existingFollowupId && (  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
                <Users className="w-4 h-4" />  
                Selecciona Cliente  
              </label>  
              <div className="relative">  
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />  
                <select  
                  value={selectedClient}  
                  onChange={(e) => setSelectedClient(e.target.value)}  
                  required  
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"  
                >  
                  <option value="">Buscar cliente...</option>  
                  {clients.map(client => (  
                    <option key={client.id} value={client.id}>  
                      #{client.customer_number} - {client.name} ({client.zone})  
                    </option>  
                  ))}  
                </select>  
              </div>  
            </div>  
          )}  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
              <Calendar className="w-4 h-4" />  
              Mes del Servicio (YYYY-MM)  
            </label>  
            <input  
              type="month"  
              name="service_month"  
              value={formData.service_month}  
              onChange={handleChange}  
              required  
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"  
            />  
          </div>  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>  
            <select  
              name="status"  
              value={formData.status}  
              onChange={handleChange}  
              required  
              disabled={formData.payment_date && formData.payment_date !== ''} // Deshabilitar si pagado  
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"  
            >  
              <option value="contactado">Contactado</option>  
              <option value="pedido">Pedido</option>  
              <option value="en_espera">En Espera</option>  
              <option value="facturado">Facturado</option>  
              <option value="pagado">Pagado (Cerrado)</option>  
            </select>  
          </div>  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
              <FileText className="w-4 h-4" />  
              Fecha de Facturación  
            </label>  
            <input  
              type="date"  
              name="billing_date"  
              value={formData.billing_date}  
              onChange={handleChange}  
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"  
            />  
          </div>  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
              <FileText className="w-4 h-4" />  
              Folio de Factura  
            </label>  
            <input  
              type="text"  
              name="invoice_folio"  
              value={formData.invoice_folio}  
              onChange={handleChange}  
              placeholder="Ej: FAC-2024-001"  
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"  
            />  
          </div>  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
              <Check className="w-4 h-4" />  
              Fecha de Pago  
            </label>  
            <input  
              type="date"  
              name="payment_date"  
              value={formData.payment_date}  
              onChange={handleChange}  
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"  
            />  
          </div>  
          <div>  
            <label className="flex items-center gap-2">  
              <input  
                type="checkbox"  
                name="registered_in_program"  
                checked={formData.registered_in_program}  
                onChange={handleChange}  
                className="rounded"  
              />  
              <span className="text-sm font-medium text-gray-700">Registrado en Programa</span>  
            </label>  
          </div>  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>  
            <textarea  
              name="observations"  
              value={formData.observations}  
              onChange={handleChange}  
              rows="3"  
              placeholder="Notas sobre el contacto, problemas, etc."  
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"  
            />  
          </div>  
          <div className="flex gap-4 pt-6 border-t border-gray-200/50">  
            <button  
              type="button"  
              onClick={onClose}  
              disabled={loading}  
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all disabled:opacity-50"  
            >  
              Cancelar  
            </button>  
            <button  
              type="submit"  
              disabled={loading || !selectedClient}  
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"  
            >  
              {loading ? 'Guardando...' : (existingFollowupId ? 'Actualizar' : 'Guardar Seguimiento')}  
            </button>  
          </div>  
        </form>  
      </motion.div>  
    </motion.div>  
  );  
};  

export default FollowupForm;