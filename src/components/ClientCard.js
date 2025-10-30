import React from 'react';  
import { motion } from 'framer-motion';  
import { Users, MapPin, Key, Coffee, Calendar, Edit2, Phone } from 'lucide-react';  
import { Link } from 'react-router-dom';  
import AddClientForm from './AddClientForm';  

const ClientCard = ({ client, onEdit, onCloseEdit }) => {  
  const [showEditForm, setShowEditForm] = React.useState(false);  

  if (showEditForm) {  
    return (  
      <AddClientForm  
        clientToEdit={client}  
        onClose={() => {  
          setShowEditForm(false);  
          if (onCloseEdit) onCloseEdit();  
        }}  
        onSuccess={onEdit}  
      />  
    );  
  }  

  return (  
    <motion.div  
      whileHover={{ y: -5, scale: 1.02 }}  
      className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative"  
    >  
      <div className="flex items-start justify-between">  
        <div className="flex-1">  
          <div className="flex items-center gap-3 mb-3">  
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">  
              <Users className="w-5 h-5 text-white" />  
            </div>  
            <div>  
              <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>  
              <p className="text-sm text-gray-500">#{client.customer_number}</p>  
            </div>  
          </div>  
          <div className="space-y-2 text-sm">  
            {client.phone && (  
              <div className="flex items-center gap-2">  
                <Phone className="w-4 h-4 text-gray-500" />  
                <span className="font-medium">{client.phone}</span>  
              </div>  
            )}  
            <div className="flex items-center gap-2">  
              <MapPin className="w-4 h-4 text-gray-500" />  
              <span className="font-medium">{client.zone}</span>  
            </div>  
            <div className="flex items-center gap-2">  
              <Key className="w-4 h-4 text-gray-500" />  
              {client.rental_key}  
            </div>  
            <div className="flex items-center gap-2">  
              <Coffee className="w-4 h-4 text-gray-500" />  
              {client.service_type === 'renta' ? 'Renta' : 'Comodato'} • {client.coffee_type || 'N/A'} ({client.kilos}kg)  
            </div>  
            <div className="flex items-center gap-2">  
              <Calendar className="w-4 h-4 text-gray-500" />  
              Cierre: {client.cutoff_day} del mes • Valor: ${client.service_value_with_coffee?.toLocaleString() || 'N/A'}  
            </div>  
          </div>  
        </div>  
        <div className="flex items-center gap-2">  
          <Link  
            to={`/client/${client.id}`}  
            className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 text-xs"  
          >  
            Detalles  
          </Link>  
          <motion.button  
            onClick={() => setShowEditForm(true)}  
            whileHover={{ scale: 1.05 }}  
            className="p-2 text-amber-500 hover:text-amber-700 rounded-full hover:bg-amber-50 transition-all"  
          >  
            <Edit2 className="w-4 h-4" />  
          </motion.button>  
        </div>  
      </div>  
    </motion.div>  
  );  
};  

export default ClientCard;