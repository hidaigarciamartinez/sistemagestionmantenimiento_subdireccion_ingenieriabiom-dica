document.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Configuración Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyB05ZOHYNasz-OXz0WUc9ItU9V_UNIiCZo",
    authDomain: "inven-aed0b.firebaseapp.com",
    projectId: "inven-aed0b",
    storageBucket: "inven-aed0b.firebasestorage.app",
    messagingSenderId: "847520272319",
    appId: "1:847520272319:web:8eebdd254db70c3f759b0a",
    measurementId: "G-G1D74TVXMB"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // 2️⃣ Elementos
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const addBtn = document.getElementById("add-btn");
  const inventoryBody = document.getElementById("inventory-table");

  // 3️⃣ Login y registro
  const correosPermitidos = [
  "hidaigarciamartinez@gmail.com",
  "hidaiamisadaigarciamartinez@gmail.com",
  "tlqhidaigarciamartinez@gmail.com"
  
];

loginBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  if (!correosPermitidos.includes(email)) {
    alert("Este correo no está autorizado para acceder.");
    return;
  }

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => alert("¡Sesión iniciada correctamente!"))
    .catch(e => alert("Error login: " + e.message));
};


  logoutBtn.onclick = () => auth.signOut();

  // 4️⃣ Mostrar app si hay usuario
  auth.onAuthStateChanged(user => {
    if(user){
      document.getElementById("auth-section").style.display = "none";
      document.getElementById("app-section").style.display = "block";
      loadInventory();
    } else {
      document.getElementById("auth-section").style.display = "block";
      document.getElementById("app-section").style.display = "none";
    }
  });

  // 🔹 Función para mostrar solo mes y año (Ejemplo: "Octubre 2025")
function formatearMesAnio(fechaStr) {
  if (!fechaStr) return "-";
  const fecha = new Date(fechaStr);
  const opciones = { year: 'numeric', month: 'long' };
  return fecha.toLocaleDateString('es-ES', opciones);
}

  // 5️⃣ Cargar inventario
  function loadInventory() { 
  inventoryBody.innerHTML = "";
  db.collection("equipos").get().then(snapshot => {
    let index = 1;
    snapshot.forEach(doc => {
      const d = doc.data();

      // Determinar clase de color según el estado
      let estadoClass = "";
      if (d.estatus === "Vencido") estadoClass = "estado-vencido";
      else if (d.estatus === "Realizado") estadoClass = "estado-realizado";
      else estadoClass = "estado-pendiente";

      // Configuración del botón según estado
      let statusClass = "pendiente";
      let buttonText = "Marcar Realizado";
      if (d.estatus === "Realizado") { statusClass = "realizado"; buttonText = "Realizado"; }
      if (d.estatus === "Vencido") { statusClass = "vencido"; buttonText = "Vencido"; }

      const disabledAttr = (d.estatus === "Realizado") ? "disabled" : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index}</td>
        <td>${d.equipo}</td>
        <td>${d.id}</td>
        <td>${d.marca}</td>
        <td>${d.modelo}</td>
        <td>${d.serie}</td>
        <td>${d.ubicacion}</td>
       <td>${formatearMesAnio(d.fecha_ultimo_mantenimiento)}</td>
       <td>${formatearMesAnio(d.fecha_mantenimiento)}</td>
        <td class="${estadoClass}">${d.estatus || "Pendiente"}</td>
        <td>${d.estadosituacional}</td>
        <td>${d.observaciones}</td>
         <td>${d.realizo_mantenimiento}</td>
         <td><a href="${d.archivo}" target="_blank">Ver archivo</a></td>
       <td>
  <button class="${statusClass}" ${disabledAttr} onclick="updateStatus('${doc.id}')">${buttonText}</button>
  <button onclick="editData('${doc.id}')">Editar</button>
  <button onclick="deleteData('${doc.id}')">Eliminar</button>
  ${
  /ventilador\s*mec(a|á)nico/i.test(d.equipo)
    ? `<button onclick="window.location.href='index2.html?id=${encodeURIComponent(d.id)}'">Hoja de servicio</button>`
    : /(monitor(\s*de)?\s*signos\s*vitales)/i.test(d.equipo)
      ? `<button onclick="window.location.href='index4.html?id=${encodeURIComponent(d.id)}'">Hoja de servicio</button>`
      : /desfibrilador/i.test(d.equipo)
        ? `<button onclick="window.location.href='index3.html?id=${encodeURIComponent(d.id)}'">Hoja de servicio</button>`
        : ""
}



</td>


      `;
      inventoryBody.appendChild(tr);
      index++;
    });

    // 🔹 Calcular indicadores
let totalEquipos = snapshot.size;
let realizados = 0;

snapshot.forEach(doc => {
  const d = doc.data();
  if (d.estatus === "Realizado") {
    realizados++;
  }
});

let porcentaje = totalEquipos > 0 ? ((realizados / totalEquipos) * 100).toFixed(1) : 0;

// 🔹 Mostrar resultados en la interfaz
document.getElementById("total-equipos").textContent = totalEquipos;
document.getElementById("equipos-realizados").textContent = realizados;
document.getElementById("porcentaje-mantenimiento").textContent = porcentaje + "%";

  });
}


  // 6️⃣ Agregar o Editar
  addBtn.onclick = () => {
    const data = {
      equipo: document.getElementById("equipo").value,
      id:document.getElementById("id").value,
      marca: document.getElementById("marca").value,
      modelo: document.getElementById("modelo").value,
      serie: document.getElementById("serie").value,
      ubicacion: document.getElementById("ubicacion").value,
      estadosituacional:document.getElementById("estadosituacional").value,
      archivo: document.getElementById("archivo").value,
      fecha_mantenimiento: document.getElementById("fecha-mantenimiento").value,
      estatus: document.getElementById("estatus").value || "Pendiente",
      observaciones:document.getElementById("observaciones").value,
      realizo_mantenimiento:document.getElementById("realizo-mantenimiento").value
    };

    const editId = addBtn.getAttribute("data-edit-id");

    if(editId){
      db.collection("equipos").doc(editId).update(data).then(() => {
        alert("Equipo actualizado ✅");
        addBtn.removeAttribute("data-edit-id");
        addBtn.innerText = "Agregar";
        document.getElementById("form-title").innerText = "Agregar equipo";
        loadInventory();
      });
    } else {
      db.collection("equipos").add(data).then(() => {
        alert("Equipo agregado ✅");
        loadInventory();
      });
    }

    // Limpiar formulario
    ["equipo","id","estadosituacional","marca","modelo","serie","ubicacion","archivo","fecha-mantenimiento"].forEach(id => {
      document.getElementById(id).value = "";
    });
  };

  // 7️⃣ Editar equipo
  window.editData = function(id){
    db.collection("equipos").doc(id).get().then(doc => {
      if(doc.exists){
        const d = doc.data();
        
        document.getElementById("equipo").value = d.equipo;
        document.getElementById("id").value=d.id;
        document.getElementById("marca").value = d.marca;
        document.getElementById("modelo").value = d.modelo;
        document.getElementById("serie").value = d.serie;
        document.getElementById("ubicacion").value = d.ubicacion;
        document.getElementById("estadosituacional").value=d.estadosituacional;
        document.getElementById("fecha-mantenimiento").value = d.fecha_mantenimiento;
        document.getElementById("estatus").value = d.estatus;
        document.getElementById("observaciones").value= d.observaciones;
        document.getElementById("realizo-mantenimiento").value= d.realizo_mantenimiento;
        document.getElementById("archivo").value = d.archivo;
        addBtn.setAttribute("data-edit-id", id);
        document.getElementById("form-title").innerText = "Editar equipo";
        addBtn.innerText = "Guardar cambios";
      }
    });
  };

  // 8️⃣ Cambiar estatus y actualizar fechas
window.updateStatus = function(id) {
  const hoy = new Date();
  const fechaActual = hoy.toISOString().split('T')[0];

  // Calcular nueva fecha de mantenimiento (6 meses después)
  const proximo = new Date(hoy);
  proximo.setMonth(proximo.getMonth() + 6);
  const fechaProximo = proximo.toISOString().split('T')[0];

  db.collection("equipos").doc(id).update({
    estatus: "Realizado",
    fecha_ultimo_mantenimiento: fechaActual,
    fecha_mantenimiento: fechaProximo
  }).then(() => {
    alert("Mantenimiento actualizado ✅");
    loadInventory();
  });
};



  // 🗑️ Eliminar equipo
window.deleteData = function(id) {
  if (confirm("¿Seguro que deseas eliminar este equipo?")) {
    db.collection("equipos").doc(id).delete().then(() => {
      alert("Equipo eliminado ✅");
      loadInventory(); // recargar tabla
    }).catch(e => alert("Error al eliminar: " + e.message));
  }
};


  // 🔹 Verificar y actualizar automáticamente el estado de mantenimiento
document.getElementById("update-status-btn")?.addEventListener("click", () => {
  const hoy = new Date();

  db.collection("equipos").get().then(snapshot => {
    snapshot.forEach(doc => {
      const d = doc.data();

      if (!d.fecha_mantenimiento || d.estatus === "Realizado") return;

      const fechaMantenimiento = new Date(d.fecha_mantenimiento);
      const diferenciaDias = Math.floor((fechaMantenimiento - hoy) / (1000 * 60 * 60 * 24));

      let nuevoEstatus = d.estatus;

      // Si faltan 30 días o menos → Pendiente
      if (diferenciaDias <= 30 && diferenciaDias > 0 && d.estatus !== "Pendiente") {
        nuevoEstatus = "Pendiente";
      }

      // Si ya pasó la fecha → Vencido
      if (diferenciaDias <= -30 && d.estatus !== "Vencido") {
        nuevoEstatus = "Vencido";
      }

      // Actualizar si cambió el estado
      if (nuevoEstatus !== d.estatus) {
        db.collection("equipos").doc(doc.id).update({ estatus: nuevoEstatus });
      }
    });
  }).then(() => loadInventory());
});


  
});
