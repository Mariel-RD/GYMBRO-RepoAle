const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const resenaCoachSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String },
    fechaResena: { type: Date, default: Date.now }
});

const ResenaCoach = mongoose.model('ResenaCoach', resenaCoachSchema);

// POST /api/resenas-coach
router.post('/', async (req, res) => {
    const { clienteId, coachId, calificacion, comentario, fechaResena } = req.body;

    if (!clienteId || !coachId || calificacion == null) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (calificacion < 1 || calificacion > 5) {
        return res.status(400).json({ message: 'La calificacion debe ser entre 1 y 5' });
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

    const nuevaResena = new ResenaCoach({ clienteId, coachId, calificacion, comentario, fechaResena: fechaResena || new Date() });
    await nuevaResena.save();

    res.status(201).json({ message: 'Reseña registrada exitosamente' });
});

// GET /api/resenas-coach/coach/:coachId
router.get('/coach/:coachId', async (req, res) => {
    try {
        const resenas = await ResenaCoach.find({ coachId: req.params.coachId })
            .populate('clienteId', 'nombre apellido')
            .sort({ fechaResena: -1 });
        res.json(resenas);
    } catch (err) {
        res.status(500).json({ message: 'Error interno', error: err });
    }
});

// DELETE /api/resenas-coach/:id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await ResenaCoach.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Reseña no encontrada' });
        res.json({ message: 'Reseña eliminada exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error interno al eliminar la reseña', error: err });
    }
});

module.exports = router;
