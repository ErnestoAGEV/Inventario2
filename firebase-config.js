// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDnDHbxxpjT6fybu1Cclz2RttPkiXaiFJc",
    authDomain: "inventairopersonal.firebaseapp.com",
    projectId: "inventairopersonal",
    storageBucket: "inventairopersonal.appspot.com", // <-- CORREGIDO
    messagingSenderId: "423562855921",
    appId: "1:423562855921:web:038786949fe7e33956f050"
  };
  

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
