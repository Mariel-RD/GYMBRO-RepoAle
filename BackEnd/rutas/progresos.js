const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const progresoClienteSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha: { type: Date, required: true },
    peso: { type: Number, required: true, min: 1, max: 500 },
    notas: { type: String, default: '' },
    fechaRegistro: { type: Date, default: Date.now }
});

const ProgresoCliente = mongoose.model('ProgresoCliente', progresoClienteSchema);

// POST /api/progresos
router.post('/', async (req, res) => {
    const { clienteId, fecha, peso, notas } = req.body;

    if (!clienteId || !fecha || peso == null) {
        return res.status(400).json({ message: 'clienteId, fecha y peso son obligatorios' });
    }

    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
        return res.status(400).json({ message: 'clienteId no tiene un formato valido' });
    }

    const fechaProgreso = new Date(fecha);
    if (Number.isNaN(fechaProgreso.getTime())) {
        return res.status(400).json({ message: 'La fecha es invalida' });
    }

    const pesoNumerico = Number(peso);
    if (!Number.isFinite(pesoNumerico) || pesoNumerico <= 0) {
        return res.status(400).json({ message: 'El peso debe ser un numero mayor a 0' });
    }

    const Usuario = mongoose.model('Usuario');
    const cliente = await Usuario.findById(clienteId);
    if (!cliente || cliente.rol !== 'cliente') {
        return res.status(400).json({ message: 'El cliente no existe o no tiene rol cliente' });
    }

    const nuevoProgreso = new ProgresoCliente({
        clienteId,
        fecha: fechaProgreso,
        peso: pesoNumerico,
        notas: notas ? String(notas).trim() : ''
    });

    await nuevoProgreso.save();

    res.status(201).json({
        message: 'Progreso guardado exitosamente',
        progreso: {
            id: nuevoProgreso._id,
            clienteId: nuevoProgreso.clienteId,
            fecha: nuevoProgreso.fecha,
            peso: nuevoProgreso.peso,
            notas: nuevoProgreso.notas
        }
    });
});

// GET /api/progresos/:clienteId
router.get('/:clienteId', async (req, res) => {
    const { clienteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
        return res.status(400).json({ message: 'clienteId no tiene un formato valido' });
    }

    const progresos = await ProgresoCliente.find({ clienteId }).sort({ fecha: 1 });
    res.json(progresos);
});

module.exports = router;
