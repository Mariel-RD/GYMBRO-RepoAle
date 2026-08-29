const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const asignacionRutinaSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    rutinaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rutina', required: true },
    fechaAsignacion: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['activa', 'inactiva'],
        default: 'activa'
    }
});

const AsignacionRutina = mongoose.model('AsignacionRutina', asignacionRutinaSchema);

// POST /api/asignacion-rutinas
router.post('/', async (req, res) => {
    const { clienteId, coachId, rutinaId, fechaAsignacion, estado } = req.body;

    if (!clienteId || !coachId || !rutinaId) {
        return res.status(400).json({ message: 'clienteId, coachId y rutinaId son obligatorios' });
    }

    const nuevaAsignacion = new AsignacionRutina({
        clienteId,
        coachId,
        rutinaId,
        fechaAsignacion: fechaAsignacion || new Date(),
        estado: estado || 'activa'
    });

    await nuevaAsignacion.save();

    res.status(201).json({
        message: 'Asignacion de rutina creada exitosamente',
        asignacion: {
            id: nuevaAsignacion._id,
            clienteId: nuevaAsignacion.clienteId,
            coachId: nuevaAsignacion.coachId,
            rutinaId: nuevaAsignacion.rutinaId,
            estado: nuevaAsignacion.estado
        }
    });
});

// GET /api/asignacion-rutinas
router.get('/', async (req, res) => {
    const asignaciones = await AsignacionRutina.find()
        .populate('clienteId', 'nombre apellido fotoPerfil')
        .populate('coachId', 'nombre apellido fotoPerfil')
        .populate('rutinaId', 'nombreRutina objetivo');
    res.json(asignaciones);
});

// DELETE /api/asignacion-rutinas
router.delete('/', async (req, res) => {
    try {
        const { clienteId, rutinaId } = req.body;
        await AsignacionRutina.deleteMany({ clienteId, rutinaId });
        res.json({ message: 'Asignacion eliminada exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error interno', error: err });
    }
});

module.exports = router;
