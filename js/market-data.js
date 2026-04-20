/* Market Data Fetching */
document.addEventListener("DOMContentLoaded", () => {

    // Configuración
    const API_KEY_ALPHAVANTAGE = "ZJWYU1FQI8HDHFRK"; // REEMPLAZA CON TU API KEY DE ALPHAVANTAGE
    const CACHE_TIME_MINUTES = 60; // Refrescar cache de API cada 1 hora para no llegar a límites diarios

    const valUsd = document.getElementById("val-usd");
    const valOil = document.getElementById("val-oil");

    // Función para obtener Dólar (Datos Abiertos Colombia)
    async function fetchUSD() {
        const cacheKey = "ademincol_usd";
        const cacheTimeKey = "ademincol_usd_time";

        let cached = localStorage.getItem(cacheKey);
        let cacheTime = localStorage.getItem(cacheTimeKey);
        let now = new Date().getTime();

        // Validar caché
        if (cached && cacheTime && (now - cacheTime < CACHE_TIME_MINUTES * 60 * 1000)) {
            valUsd.innerText = `$${cached}`;
            return;
        }

        try {
            const response = await fetch("https://www.datos.gov.co/resource/mcec-87by.json?$limit=1&$order=vigenciadesde%20DESC");
            const data = await response.json();

            if (data && data.length > 0) {
                // Formatear pesos con punto de miles
                let value = parseFloat(data[0].valor).toLocaleString("es-CO", { minimumFractionDigits: 2 });
                localStorage.setItem(cacheKey, value);
                localStorage.setItem(cacheTimeKey, now);
                valUsd.innerText = `$${value}`;
            }
        } catch (error) {
            console.error("Error obteniendo TRM:", error);
            valUsd.innerText = "N/D";
        }
    }

    // Función para obtener Petróleo Brent (Alpha Vantage)
    async function fetchOil() {
        const cacheKey = "ademincol_oil";
        const cacheTimeKey = "ademincol_oil_time";

        let cached = localStorage.getItem(cacheKey);
        let cacheTime = localStorage.getItem(cacheTimeKey);
        let now = new Date().getTime();

        if (cached && cacheTime && (now - cacheTime < CACHE_TIME_MINUTES * 60 * 1000)) {
            valOil.innerText = `$${cached}`;
            return;
        }

        try {
            if (API_KEY_ALPHAVANTAGE === "TU_API_KEY_AQUI") {
                valOil.innerText = "Configurar API";
                return;
            }

            const response = await fetch(`https://www.alphavantage.co/query?function=BRENT&interval=d&apikey=${API_KEY_ALPHAVANTAGE}`);
            const data = await response.json();

            if (data && data.data && data.data.length > 0) {
                let value = parseFloat(data.data[0].value).toFixed(2);
                localStorage.setItem(cacheKey, value);
                localStorage.setItem(cacheTimeKey, now);
                valOil.innerText = `$${value}`;
            } else if (data && data.Note) { // Rate limit reached
                valOil.innerText = cached ? `$${cached}` : "Límite API";
            }
        } catch (error) {
            console.error("Error obteniendo Brent:", error);
            valOil.innerText = cached ? `$${cached}` : "N/D";
        }
    }

    if (valUsd) fetchUSD();
    if (valOil) fetchOil();
});
