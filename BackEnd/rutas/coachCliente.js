const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const coachClienteSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fechaAsignacion: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['activo', 'inactivo'],
        default: 'activo'
    }
});

const CoachCliente = mongoose.model('CoachCliente', coachClienteSchema);

// POST /api/coach-cliente
router.post('/', async (req, res) => {
    const { clienteId, coachId, fechaAsignacion, estado } = req.body;

    if (!clienteId || !coachId) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const Usuario = mongoose.model('Usuario');

    const cliente = await Usuario.findById(clienteId);
    if (!cliente || cliente.rol !== 'cliente') {
        return res.status(400).json({ message: 'El cliente no existe o no tiene rol cliente' });
    }

    const coach = await Usuario.findById(coachId);
    if (!coach || coach.rol !== 'coach') {
        return res.status(400).json({ message: 'El coach no existe o no tiene rol coach' });
    }

    const existingRelation = await CoachCliente.findOne({ clienteId });
    if (existingRelation) {
        const isSameCoach = existingRelation.coachId.toString() === coachId.toString();
        const message = isSameCoach
            ? 'Ya seleccionaste a este coach'
            : 'Ya tienes un coach seleccionado. Desvinculalo antes de elegir otro.';
        return res.status(409).json({ message });
    }

    const nuevaRelacion = new CoachCliente({ clienteId, coachId, fechaAsignacion, estado: estado || 'activo' });
    await nuevaRelacion.save();

    res.status(201).json({ message: 'Relacion coach-cliente creada exitosamente' });
});

// GET /api/coach-cliente/cliente/:clienteId
router.get('/cliente/:clienteId', async (req, res) => {
    try {
        const relaciones = await CoachCliente.find({ clienteId: req.params.clienteId });
        res.json(relaciones);
    } catch (err) {
        res.status(500).json({ message: 'Error interno', error: err });
    }
});

// GET /api/coach-cliente/coach/:coachId
router.get('/coach/:coachId', async (req, res) => {
    try {
        const relaciones = await CoachCliente.find({ coachId: req.params.coachId })
            .populate('clienteId', 'nombre apellido email fotoPerfil');
        res.json(relaciones);
    } catch (err) {
        res.status(500).json({ message: 'Error interno', error: err });
    }
});

// DELETE /api/coach-cliente
router.delete('/', async (req, res) => {
    try {
        const { clienteId, coachId } = req.body;
        await CoachCliente.findOneAndDelete({ clienteId, coachId });
        res.json({ message: 'Coach desvinculado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error interno', error: err });
    }
});

module.exports = router;
