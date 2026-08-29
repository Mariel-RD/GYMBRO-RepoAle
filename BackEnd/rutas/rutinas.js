const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const rutinaSchema = new mongoose.Schema({
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombreRutina: { type: String, required: true },
    objetivo: {
        type: String,
        enum: ['Hipertrofia', 'Fuerza', 'Acondicionamiento', 'Resistencia'],
        required: true
    },
    nivel: {
        type: String,
        enum: ['Principiante', 'Intermedio', 'Avanzado'],
        required: true
    },
    notas: { type: String },
    ejercicios: [{
        dia: {
            type: String,
            enum: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'],
            required: true
        },
        ejercicio: { type: String, required: true },
        series: { type: Number, required: true, min: 1 },
        repeticiones: { type: String, required: true },
        descanso: { type: String, default: '-' }
    }],
    fechaCreacion: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['activa', 'inactiva'],
        default: 'activa'
    }
});

const Rutina = mongoose.model('Rutina', rutinaSchema);

// POST /api/rutinas
router.post('/', async (req, res) => {
    const { coachId, nombreRutina, objetivo, nivel, notas, ejercicios, fechaCreacion, estado } = req.body;
    const diasValidos = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    if (!coachId || !nombreRutina || !objetivo || !nivel) {
        return res.status(400).json({ message: 'Todos los campos obligatorios de la rutina deben enviarse' });
    }

    if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
        return res.status(400).json({ message: 'La rutina debe incluir al menos un ejercicio' });
    }

    const Usuario = mongoose.model('Usuario');
    const coach = await Usuario.findById(coachId);
    if (!coach || coach.rol !== 'coach') {
        return res.status(400).json({ message: 'El coach no existe o no tiene rol coach' });
    }

    const Ejercicio = mongoose.model('Ejercicio');
    const ejerciciosCatalogo = await Ejercicio.find({}, 'nombreEjercicio').lean();
    const nombresEjerciciosCatalogo = new Set(
        ejerciciosCatalogo
            .map((e) => String(e.nombreEjercicio || '').trim().toLowerCase())
            .filter(Boolean)
    );

    const nombreRutinaLimpio = String(nombreRutina).trim();
    if (!nombreRutinaLimpio) {
        return res.status(400).json({ message: 'El nombre de la rutina es obligatorio' });
    }

    const ejerciciosNormalizados = ejercicios.map((item) => ({
        dia: item.dia ? String(item.dia).trim() : '',
        ejercicio: item.ejercicio ? String(item.ejercicio).trim() : '',
        series: Number(item.series),
        repeticiones: item.repeticiones ? String(item.repeticiones).trim() : '',
        descanso: item.descanso ? String(item.descanso).trim() : '-'
    }));

    const erroresEjercicios = [];
    ejerciciosNormalizados.forEach((item, index) => {
        if (!item.ejercicio) {
            erroresEjercicios.push(`Fila ${index + 1}: ejercicio es obligatorio`);
        } else if (!nombresEjerciciosCatalogo.has(item.ejercicio.toLowerCase())) {
            erroresEjercicios.push(`Fila ${index + 1}: el ejercicio no existe en el catalogo`);
        }

        if (!item.dia || !diasValidos.includes(item.dia)) {
            erroresEjercicios.push(`Fila ${index + 1}: dia invalido`);
        }

        if (!Number.isFinite(item.series) || item.series < 1) {
            erroresEjercicios.push(`Fila ${index + 1}: series debe ser un numero mayor o igual a 1`);
        }

        if (!item.repeticiones) {
            erroresEjercicios.push(`Fila ${index + 1}: repeticiones es obligatorio`);
        }
    });

    if (erroresEjercicios.length > 0) {
        return res.status(400).json({ message: 'Hay errores en los ejercicios enviados', errores: erroresEjercicios });
    }

    const nuevaRutina = new Rutina({
        coachId,
        nombreRutina: nombreRutinaLimpio,
        objetivo,
        nivel,
        notas: notas ? String(notas).trim() : '',
        ejercicios: ejerciciosNormalizados,
        fechaCreacion: fechaCreacion || new Date(),
        estado: estado || 'activa'
    });

    await nuevaRutina.save();

    res.status(201).json({
        message: 'Rutina creada exitosamente',
        rutina: {
            id: nuevaRutina._id,
            nombreRutina: nuevaRutina.nombreRutina,
            totalEjercicios: nuevaRutina.ejercicios.length
        }
    });
});

// GET /api/rutinas
router.get('/', async (req, res) => {
    const rutinas = await Rutina.find();
    res.json(rutinas);
});

// DELETE /api/rutinas/:id
router.delete('/:id', async (req, res) => {
    try {
        const rutina = await Rutina.findByIdAndDelete(req.params.id);
        if (!rutina) {
            return res.status(404).json({ message: 'Rutina no encontrada' });
        }
        res.json({ message: 'Rutina eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
});

// GET /api/rutinas/:id
router.get('/:id', async (req, res) => {
    try {
        const rutina = await Rutina.findById(req.params.id);
        if (!rutina) {
            return res.status(404).json({ message: 'Rutina no encontrada' });
        }
        res.json(rutina);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la rutina', error });
    }
});

// PUT /api/rutinas/:id
router.put('/:id', async (req, res) => {
    const { nombreRutina, objetivo, nivel, notas, ejercicios } = req.body;
    const diasValidos = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    if (!nombreRutina || !objetivo || !nivel) {
        return res.status(400).json({ message: 'Todos los campos obligatorios de la rutina deben enviarse' });
    }

    if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
        return res.status(400).json({ message: 'La rutina debe incluir al menos un ejercicio' });
    }

    const Ejercicio = mongoose.model('Ejercicio');
    const ejerciciosCatalogo = await Ejercicio.find({}, 'nombreEjercicio').lean();
    const nombresEjerciciosCatalogo = new Set(
        ejerciciosCatalogo
            .map((e) => String(e.nombreEjercicio || '').trim().toLowerCase())
            .filter(Boolean)
    );

    const nombreRutinaLimpio = String(nombreRutina).trim();
    if (!nombreRutinaLimpio) {
        return res.status(400).json({ message: 'El nombre de la rutina es obligatorio' });
    }

    const ejerciciosNormalizados = ejercicios.map((item) => ({
        dia: item.dia ? String(item.dia).trim() : '',
        ejercicio: item.ejercicio ? String(item.ejercicio).trim() : '',
        series: Number(item.series),
        repeticiones: item.repeticiones ? String(item.repeticiones).trim() : '',
        descanso: item.descanso ? String(item.descanso).trim() : '-'
    }));

    const erroresEjercicios = [];
    ejerciciosNormalizados.forEach((item, index) => {
        if (!item.ejercicio) {
            erroresEjercicios.push(`Fila ${index + 1}: ejercicio es obligatorio`);
        } else if (!nombresEjerciciosCatalogo.has(item.ejercicio.toLowerCase())) {
            erroresEjercicios.push(`Fila ${index + 1}: el ejercicio no existe en el catalogo`);
        }

        if (!item.dia || !diasValidos.includes(item.dia)) {
            erroresEjercicios.push(`Fila ${index + 1}: dia invalido`);
        }

        if (!Number.isFinite(item.series) || item.series < 1) {
            erroresEjercicios.push(`Fila ${index + 1}: series debe ser un numero mayor o igual a 1`);
        }

        if (!item.repeticiones) {
            erroresEjercicios.push(`Fila ${index + 1}: repeticiones es obligatorio`);
        }
    });

    if (erroresEjercicios.length > 0) {
        return res.status(400).json({ message: 'Hay errores en los ejercicios enviados', errores: erroresEjercicios });
    }

    try {
        const rutinaActualizada = await Rutina.findByIdAndUpdate(
            req.params.id,
            {
                nombreRutina: nombreRutinaLimpio,
                objetivo,
                nivel,
                notas: notas ? String(notas).trim() : '',
                ejercicios: ejerciciosNormalizados
            },
            { new: true }
        );

        if (!rutinaActualizada) {
            return res.status(404).json({ message: 'Rutina no encontrada' });
        }

        res.json({ message: 'Rutina actualizada exitosamente', rutina: rutinaActualizada });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
});

module.exports = router;
