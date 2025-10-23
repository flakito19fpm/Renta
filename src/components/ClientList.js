import React, { useState, useEffect } from 'react';  
import { motion } from 'framer-motion';  
import { Plus, Users } from 'lucide-react';  
import { supabase } from '../utils/supabase';  
import ClientCard from './ClientCard';  
import AddClientForm from './AddClientForm';  

const ClientList = () => {  
  const [clients, setClients] = useState([]);  
  const [showAddForm, setShowAddForm] = useState(false);  
  const [loading, setLoading] = useState(true);  

  useEffect(() => {  
    fetchClients();  
  }, []);  

  const fetchClients = async () => {  
    setLoading(true);  
    const { data, error } = await supabase  
      .from('clients')  
      .select('*')  
      .order('name', { ascending: true });  
    if (error) {  
      alert('Error al cargar clientes: ' + error.message);  
    } else {  
      setClients(data || []);  
    }  
    setLoading(false);  
  };  

  const handleEditSuccess = () => {  
    fetchClients(); // Refrescar lista después de editar  
  };  

  if (loading) {  
    return (  
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">  
        <motion.div className="p-8 bg-white rounded-3xl shadow-xl">Cargando clientes...  
        </motion.div>  
      </div>  
    );  
  }  

  return (  
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">  
      <div className="container mx-auto px-4 py-8 max-w-6xl">  
        <motion.div  
          initial={{ opacity: 0, y: -20 }}  
          animate={{ opacity: 1, y: 0 }}  
          className="mb-8"  
        >  
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tus Clientes</h1>  
          <p className="text-xl text-gray-600">Gestiona todos tus clientes y sus cobros de manera fácil.</p>  
        </motion.div>  

        <motion.div  
          whileHover={{ scale: 1.02 }}  
          className="mb-8"  
        >  
          <button  
            onClick={() => setShowAddForm(true)}  
            className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl font-semibold shadow-lg hover:shadow-xl transition-all"  
          >  
            <Plus className="w-5 h-5" /> Agregar Cliente  
          </button>  
        </motion.div>  

        {clients.length === 0 ? (  
          <motion.div  
            initial={{ opacity: 0, scale: 0.95 }}  
            animate={{ opacity: 1, scale: 1 }}  
            className="text-center py-16"  
          >  
            <Users className="w-24 h-24 text-gray-300 mx-auto mb-6" />  
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay clientes aún</h2>  
            <p className="text-gray-600">¡Agrega tu primer cliente para empezar!</p>  
          </motion.div>  
        ) : (  
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">  
            {clients.map((client) => (  
              <motion.div  
                key={client.id}  
                initial={{ opacity: 0, y: 20 }}  
                animate={{ opacity: 1, y: 0 }}  
                transition={{ delay: 0.1 }}  
              >  
                <ClientCard  
                  client={client}  
                  onEdit={handleEditSuccess}  
                  onCloseEdit={fetchClients}  
                />  
              </motion.div>  
            ))}  
          </div>  
        )}  

        {showAddForm && (  
          <AddClientForm  
            onClose={() => {  
              setShowAddForm(false);  
              fetchClients();  
            }}  
          />  
        )}  
      </div>  
    </div>  
  );  
};  

export default ClientList;