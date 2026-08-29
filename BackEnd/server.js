const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas
const usuariosRoutes        = require('./rutas/usuarios');
const coachClienteRoutes    = require('./rutas/coachCliente');
const resenasCoachRoutes    = require('./rutas/resenasCoach');
const ejerciciosRoutes      = require('./rutas/ejercicios');
const rutinasRoutes         = require('./rutas/rutinas');
const asignacionRoutes      = require('./rutas/asignacionRutinas');
const progresosRoutes       = require('./rutas/progresos');

// Montar rutas
app.use('/api', usuariosRoutes);
app.use('/api/coach-cliente', coachClienteRoutes);
app.use('/api/resenas-coach', resenasCoachRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/rutinas', rutinasRoutes);
app.use('/api/asignacion-rutinas', asignacionRoutes);
app.use('/api/progresos', progresosRoutes);

app.get('/api/', (req, res) => {
    res.json({ message: 'API funcionando' });
});

// Conexión a MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_app';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB conectado'))
    .catch((err) => console.error('Error de conexion:', err));

app.listen(PORT, () => {
    console.log(`Servidor GYMBRO corriendo en puerto ${PORT}`);
});