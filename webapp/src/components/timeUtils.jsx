export function decimalHoursToDDHHMMSSMS(hoursDecimal) {
    if (!hoursDecimal) return '00:00:00:00:000';

    // 1) Total milisegundos a partir de las horas decimales
    const totalMs = Math.abs(hoursDecimal) * 3600000; // 1 hora = 3600000 ms

    let remainingMs = totalMs;

    // 2) Días
    const days = Math.floor(remainingMs / (24 * 3600000));
    remainingMs -= days * (24 * 3600000);

    // 3) Horas
    const hours = Math.floor(remainingMs / 3600000);
    remainingMs -= hours * 3600000;

    // 4) Minutos
    const minutes = Math.floor(remainingMs / 60000);
    remainingMs -= minutes * 60000;

    // 5) Segundos
    const seconds = Math.floor(remainingMs / 1000);
    remainingMs -= seconds * 1000;

    // 6) Milisegundos (lo que quede)
    const millis = Math.floor(remainingMs);

    // 7) Formateo final
    const dd = String(days).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const ms = String(millis).padStart(3, '0'); // 3 dígitos

    return `${dd} días, ${hh} horas, ${mm} minutos, :${ss} segundos, ${ms} milisegundos`;
}

export function decimalHoursToHMS(decimalHrs) {
    // 1) Convertir horas decimales a TOTAL de segundos
    const totalSeconds = Math.floor(Math.abs(decimalHrs) * 3600);

    // 2) Calcular H, M, S
    const hours = Math.floor(totalSeconds / 3600);
    const leftover = totalSeconds % 3600;
    const minutes = Math.floor(leftover / 60);
    const seconds = leftover % 60;

    // 3) Retornar en formato "Hh Mm Ss"
    return `${hours}h ${minutes}m ${seconds}s`;
}

export function formatDate(isoString) {
    if (!isoString) return "-";
    const d = new Date(isoString);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}-${mm}-${yy} ${hh}:${mi}:${ss}`;
}

