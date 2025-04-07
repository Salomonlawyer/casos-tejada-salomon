
import { useState, useEffect } from "react";
import Image from "next/image";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-VfAvO8pEdtjwrKiVyZIIT7tVD-I8O6M",
  authDomain: "tejadasalomonapp.firebaseapp.com",
  projectId: "tejadasalomonapp",
  storageBucket: "tejadasalomonapp.firebasestorage.app",
  messagingSenderId: "736585809293",
  appId: "1:736585809293:web:24814ef3530bab0ff891c4",
  measurementId: "G-EZCL481HV6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function CasoManager() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [casos, setCasos] = useState([]);
  const [form, setForm] = useState({
    numero: "", cliente: "", tipo: "", incidencia: "", estado: "", cobro: "",
    pactado: "", pagado: "", fecha: "", observaciones: "", pendientes: ""
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email);
        setIsAdmin(user.email === "tejadasalomonabogados@gmail.com");
        const q = query(collection(db, "casos"), where("usuario", "==", user.email));
        onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCasos(docs);
        });
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginChange = (e) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
    } catch (error) {
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const agregarCaso = async () => {
    const balance = parseFloat(form.pactado || 0) - parseFloat(form.pagado || 0);
    const nuevoCaso = { ...form, balance, usuario: userEmail };
    try {
      await addDoc(collection(db, "casos"), nuevoCaso);
    } catch (error) {
      console.error("Error al guardar el caso:", error);
    }
    setForm({ numero: "", cliente: "", tipo: "", incidencia: "", estado: "", cobro: "", pactado: "", pagado: "", fecha: "", observaciones: "", pendientes: "" });

    if (form.fecha) {
      const fechaAudiencia = new Date(form.fecha);
      const hoy = new Date();
      const diff = fechaAudiencia.getTime() - hoy.getTime();
      const dias = Math.ceil(diff / (1000 * 3600 * 24));
      if (dias > 0) alert(`Recordatorio: audiencia del caso #${form.numero} será en ${dias} día(s).`);
    }
  };

  const eliminarCaso = async (id) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, "casos", id));
    } catch (error) {
      console.error("Error al eliminar el caso:", error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
        <h2>Acceso privado</h2>
        <input name="email" placeholder="Correo electrónico" value={loginForm.email} onChange={handleLoginChange} />
        <input name="password" type="password" placeholder="Contraseña" value={loginForm.password} onChange={handleLoginChange} />
        <button onClick={handleLogin}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ textAlign: "center" }}>
        <Image src="/logo.png" alt="Logo Tejada & Salomón" width={200} height={80} />
      </div>
      {isAdmin && (
        <div style={{ textAlign: "center", color: "green", fontWeight: "bold" }}>
          Panel de administrador activo - Gestión habilitada
        </div>
      )}
      <div style={{ border: "1px solid #ddd", padding: "1rem", marginTop: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {Object.entries(form).map(([key, value]) => (
            <input key={key} name={key} placeholder={key} value={value} onChange={handleChange} />
          ))}
        </div>
        <button onClick={agregarCaso}>Agregar Caso</button>
      </div>
      <table style={{ width: "100%", marginTop: "2rem", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["#", "Cliente", "Tipo Penal", "Incidencias", "Estado", "Cobro", "Monto Pactado", "Monto Pagado", "Balance", "Próx. Audiencia", "Observaciones", "Pendientes", isAdmin && "Acciones"].filter(Boolean).map((head, i) => (
              <th key={i} style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {casos.map((c, idx) => (
            <tr key={idx}>
              <td>{c.numero}</td><td>{c.cliente}</td><td>{c.tipo}</td><td>{c.incidencia}</td><td>{c.estado}</td>
              <td>{c.cobro}</td><td>{c.pactado}</td><td>{c.pagado}</td><td>{c.balance}</td><td>{c.fecha}</td>
              <td>{c.observaciones}</td><td>{c.pendientes}</td>
              {isAdmin && <td><button onClick={() => eliminarCaso(c.id)}>Eliminar</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
