const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    rol: {
        type: String,
        enum: ['cliente', 'coach'],
        default: 'cliente'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email no valid']
    },
    password: {
        type: String,
        required: true,
        minlength: [4, 'La contraseña debe tener al menos 4 caracteres'],
        select: false
    },
    bio: { type: String, default: '' },
    fotoPerfil: { type: String, default: '' }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        next(err);
    }
});

const Usuario = mongoose.model('Usuario', userSchema);

// POST /api/register
router.post('/register', async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol } = req.body;
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        if (password.length < 4) {
            return res.status(400).json({ message: 'La contraseña debe tener 4 caracteres o más' });
        }

        const existingUser = await Usuario.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        const newuser = new Usuario({ nombre, apellido, email, password, rol: rol || 'cliente' });
        await newuser.save();

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (err) {
        res.status(400).json({ message: err.message || 'Error al registrar usuario' });
    }
});

// POST /api/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const user = await Usuario.findOne({ email }).select('+password');
    if (!user) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_gymbro', { expiresIn: '1h' });

    res.json({
        mensaje: 'Login exitoso',
        Usuario: { id: user._id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol, bio: user.bio, fotoPerfil: user.fotoPerfil },
        token
    });
});

// GET /api/coaches
router.get('/coaches', async (req, res) => {
    const coaches = await Usuario.find({ rol: 'coach' }).select('nombre apellido email rol bio fotoPerfil');
    res.json(coaches);
});

// PUT /api/perfil/:id
router.put('/perfil/:id', async (req, res) => {
    try {
        const { nombre, apellido, email, bio, fotoPerfil } = req.body;
        const userId = req.params.id;

        // Verificar que el usuario exista
        const user = await Usuario.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Si intenta cambiar a un email que ya existe en otro usuario
        if (email && email !== user.email) {
            const existingEmail = await Usuario.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ message: 'El correo ya está en uso' });
            }
        }

        // Actualizar datos
        user.nombre = nombre || user.nombre;
        user.apellido = apellido || user.apellido;
        user.email = email || user.email;
        if (bio !== undefined) user.bio = bio;
        if (fotoPerfil !== undefined) user.fotoPerfil = fotoPerfil;

        await user.save();

        res.json({
            message: 'Perfil actualizado exitosamente',
            Usuario: { id: user._id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol, bio: user.bio, fotoPerfil: user.fotoPerfil }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
});

// PUT /api/perfil/:id/password
router.put('/perfil/:id/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.params.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Se usa select('+password') para traer el campo oculto
        const user = await Usuario.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar la contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
        }

        // Asignar nueva contraseña y guardar (el pre-save en el modelo la hasheará)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cambiar la contraseña' });
    }
});

module.exports = router;
