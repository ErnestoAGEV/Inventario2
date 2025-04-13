import bcrypt from 'bcryptjs';
import { AES } from 'crypto-js';
import enc from 'crypto-js/enc-utf8';

// Validación de fortaleza de contraseña
export function validarContraseña(contraseña) {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9])(?=.{8,})/;
    return regex.test(contraseña);
}

// Encriptación con bcrypt (para almacenamiento)
export async function encriptarContraseña(contraseña) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(contraseña, salt);
}

// Comparación de contraseñas
export async function compararContraseña(contraseña, hash) {
    return await bcrypt.compare(contraseña, hash);
}

// Encriptación adicional con AES (opcional para datos sensibles)
export function encriptarAES(texto, claveSecreta = import.meta.env.VITE_SECRET_KEY) {
    return AES.encrypt(texto, claveSecreta).toString();
}

// Desencriptación AES
export function desencriptarAES(textoCifrado, claveSecreta = import.meta.env.VITE_SECRET_KEY) {
    return AES.decrypt(textoCifrado, claveSecreta).toString(enc);
}