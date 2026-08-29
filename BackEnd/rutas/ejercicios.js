const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const ejercicioSchema = new mongoose.Schema({
    nombreEjercicio: { type: String, required: true },
    descripcion: { type: String },
    grupoMuscular: { type: String, required: true },
    videoUrl: { type: String, default: '' },
    fechaCreacion: { type: Date, default: Date.now }
});

const Ejercicio = mongoose.model('Ejercicio', ejercicioSchema);

// POST /api/ejercicios
router.post('/', async (req, res) => {
    const { nombreEjercicio, descripcion, grupoMuscular, videoUrl, fechaCreacion } = req.body;

    if (!nombreEjercicio || !grupoMuscular) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const nuevoEjercicio = new Ejercicio({ nombreEjercicio, descripcion, grupoMuscular, videoUrl: videoUrl || '', fechaCreacion: fechaCreacion || new Date() });
    await nuevoEjercicio.save();

    res.status(201).json({ message: 'Ejercicio creado exitosamente', ejercicio: nuevoEjercicio });
});

// GET /api/ejercicios
router.get('/', async (req, res) => {
    const ejercicios = await Ejercicio.find();
    res.json(ejercicios);
});

// PUT /api/ejercicios/:id
router.put('/:id', async (req, res) => {
    try {
        const { nombreEjercicio, grupoMuscular, videoUrl } = req.body;
        const ejercicio = await Ejercicio.findById(req.params.id);
        if (!ejercicio) return res.status(404).json({ message: 'Ejercicio no encontrado' });

        if (nombreEjercicio) ejercicio.nombreEjercicio = nombreEjercicio;
        if (grupoMuscular) ejercicio.grupoMuscular = grupoMuscular;
        if (videoUrl !== undefined) ejercicio.videoUrl = videoUrl;

        await ejercicio.save();
        res.json({ message: 'Ejercicio actualizado', ejercicio });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar ejercicio' });
    }
});

// DELETE /api/ejercicios/:id
router.delete('/:id', async (req, res) => {
    try {
        const ejercicio = await Ejercicio.findByIdAndDelete(req.params.id);
        if (!ejercicio) {
            return res.status(404).json({ message: 'Ejercicio no encontrado' });
        }
        res.json({ message: 'Ejercicio eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar el ejercicio', error: err });
    }
});

module.exports = router;
