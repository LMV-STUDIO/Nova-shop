/* =========================================================
   DÍAS CANCELADOS - PÁGINA PÚBLICA DE BARBERÍA
   Bloquea reservas para días cancelados por el negocio.
   No modifica ni borra turnos existentes.
   ========================================================= */

(() => {
    const parametros = new URLSearchParams(window.location.search);
    const NEGOCIO_ID_PUBLICO = parametros.get("negocio");

    if (!NEGOCIO_ID_PUBLICO) return;

    const SUPABASE_URL = "https://cqelidpshitntewsktwx.supabase.co";
    const SUPABASE_KEY = "sb_publishable_o1q2pLVF1zIlZCzPHMaheg_KSawjVvD";

    const cliente = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    let diaCancelado = false;

    function escapeHtmlPublico(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function obtenerFecha() {
        const input = document.getElementById("fechaTurno");
        return input ? input.value : "";
    }

    function obtenerMensaje() {
        return document.getElementById("mensajeReserva");
    }

    function mostrarEstadoDia(cancelado, fecha) {
        const container = document.getElementById("horariosContainer");
        const titulo = document.getElementById("horariosTitulo");
        const horaInput = document.getElementById("horaTurno");
        const botonReservar = document.getElementById("botonReservar");

        if (!container) return;

        if (cancelado) {
            if (titulo) titulo.style.display = "block";
            if (horaInput) horaInput.value = "";
            if (botonReservar) botonReservar.disabled = true;

            container.innerHTML = `
                <div class="horarios-vacio" style="border-color:#633;color:#ff9999;background:#160d0d;">
                    🚫 <strong>DÍA CANCELADO</strong><br>
                    La barbería no toma reservas para el ${escapeHtmlPublico(fecha)}.
                    <br><br>
                    Elegí otra fecha para continuar.
                </div>
            `;
        } else {
            if (botonReservar) botonReservar.disabled = false;
        }
    }

    async function comprobarDiaPublico(fecha) {
        if (!fecha) {
            diaCancelado = false;
            mostrarEstadoDia(false, fecha);
            return false;
        }

        const { data, error } = await cliente
            .from("dias_cancelados")
            .select("id, fecha")
            .eq("negocio_id", NEGOCIO_ID_PUBLICO)
            .eq("fecha", fecha)
            .maybeSingle();

        if (error) {
            console.error("Error comprobando día cancelado:", error);
            diaCancelado = false;
            return false;
        }

        diaCancelado = !!data;
        mostrarEstadoDia(diaCancelado, fecha);
        return diaCancelado;
    }

    function conectarEventos() {
        const fecha = document.getElementById("fechaTurno");
        const barbero = document.getElementById("barberoSelect");
        const servicio = document.getElementById("servicioSelect");

        if (fecha) {
            fecha.addEventListener("change", () => {
                comprobarDiaPublico(fecha.value);
            });
        }

        if (barbero) {
            barbero.addEventListener("change", () => {
                comprobarDiaPublico(obtenerFecha());
            });
        }

        if (servicio) {
            servicio.addEventListener("change", () => {
                comprobarDiaPublico(obtenerFecha());
            });
        }

        /* Segunda barrera: aunque alguien intente reservar directamente,
           se vuelve a consultar Supabase antes de ejecutar la reserva. */
        if (typeof window.reservarTurno === "function") {
            const reservarOriginal = window.reservarTurno;

            window.reservarTurno = async function () {
                const fechaActual = obtenerFecha();

                if (await comprobarDiaPublico(fechaActual)) {
                    const mensaje = obtenerMensaje();
                    if (mensaje) {
                        mensaje.innerHTML = `
                            <div class="error">
                                🚫 No se puede reservar porque el día seleccionado está cancelado.
                            </div>
                        `;
                    }
                    return;
                }

                return reservarOriginal();
            };
        }

        comprobarDiaPublico(obtenerFecha());
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", conectarEventos);
    } else {
        conectarEventos();
    }
})();
