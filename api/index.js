const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const { Pool } = require("pg");
require("dotenv").config();
const sql = require("mssql");
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);

const corsOptions = {
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    port: process.env.PG_PORT,
});

const sqlConfig = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    server: process.env.SQL_SERVER,
    port: parseInt(process.env.SQL_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado");

    socket.on("disconnect", () => {
        console.log("Cliente desconectado");
    });
});

app.post("/login", async (req, res) => {
    const { legajo, password } = req.body;

    try {
        const userQuery = await pool.query(
            "SELECT * FROM usuarios_login WHERE legajo = $1",
            [legajo]
        );
        const user = userQuery.rows[0];

        if (user && user.password === password) {
            res.json({
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                rol: user.rol,
                legajo: user.legajo,
            });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/usuarios", async (req, res) => {
    const { nombre, apellido, legajo, rol } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO usuarios (nombre, apellido, legajo) VALUES ($1, $2, $3) RETURNING *",
            [nombre, apellido, legajo]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/salidas", async (req, res) => {
    const { legajo, motivo, creador, observaciones } = req.body;
    const fechaHoraActual = new Date();

    const pendingSalidaResult = await pool.query(
        "SELECT * FROM salidas WHERE legajo = $1 AND estado IN ($2, $3)",
        [legajo, "Pendiente", "Activo"]
    );

    if (pendingSalidaResult.rows.length > 0) {
        res
            .status(400)
            .json({ error: "El usuario ya tiene una salida pendiente." });
        return;
    }

    try {
        const insertResult = await pool.query(
            "INSERT INTO salidas (legajo, motivo_salida, created, supervisor, estado, observaciones) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [legajo, motivo, fechaHoraActual, creador, "Pendiente", observaciones]
        );

        const nuevaSalidaId = insertResult.rows[0].id;

        const query = `
            SELECT 
                s.id, 
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso, 
                s.horario_salida, 
                s.timestamp_salida, 
                s.timestamp_regreso, 
                ms.motivo_salida AS motivo, 
                s.created,
                s.estado,
                s.observaciones,
                TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
                ul.legajo as legajoSupervisor
            FROM 
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN usuarios_login ul ON s.supervisor = ul.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            WHERE 
                s.id = $1
            ORDER BY s.created DESC`;

        const fullResult = await pool.query(query, [nuevaSalidaId]);

        io.emit("nuevaSalida", fullResult.rows[0]);

        res.status(201).json(fullResult.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/salidas/egreso/:id", async (req, res) => {
    const { id } = req.params;
    const fechaHoraActual = new Date();
    const fechaHoraArgentina = new Date(
        fechaHoraActual.getTime() - 3 * 60 * 60 * 1000
    );
    const fechaHoraArgentinaISO = fechaHoraArgentina.toISOString();
    const horaArgentina = fechaHoraArgentinaISO.split("T")[1].slice(0, 8);

    try {
        const result = await pool.query(
            "UPDATE salidas SET timestamp_salida = $1, horario_salida = $2, estado = $4 WHERE id = $3 RETURNING *",
            [fechaHoraArgentina, horaArgentina, id, "Activo"]
        );
        const query = `
            SELECT
                s.id,
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso,
                s.horario_salida,
                s.timestamp_salida,
                s.timestamp_regreso,
                ms.motivo_salida AS motivo,
                s.created,
                s.estado,
                s.observaciones,
                TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
                ul.legajo as legajoSupervisor
            FROM
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN usuarios_login ul on s.supervisor = ul.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            WHERE 
                s.id = $1
            ORDER BY s.created DESC`;
        const fullResult = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Salida no encontrada." });
        }
        io.emit("actualizarSalida", fullResult.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/salidas/regreso/:id", async (req, res) => {
    const { id } = req.params;
    const fechaHoraActual = new Date();
    const fechaHoraArgentina = new Date(
        fechaHoraActual.getTime() - 3 * 60 * 60 * 1000
    );
    const fechaHoraArgentinaISO = fechaHoraArgentina.toISOString();
    const horaArgentina = fechaHoraArgentinaISO.split("T")[1].slice(0, 8);

    try {
        const result = await pool.query(
            "UPDATE salidas SET timestamp_regreso = $1, horario_regreso = $2, estado = $4 WHERE id = $3 RETURNING *",
            [fechaHoraArgentina, horaArgentina, id, "Finalizado"]
        );

        const query = `
            SELECT 
                s.id, 
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso, 
                s.horario_salida, 
                s.timestamp_salida, 
                s.timestamp_regreso, 
                ms.motivo_salida AS motivo, 
                s.created,
                s.estado,
                TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
                ul.legajo as legajoSupervisor
            FROM 
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN usuarios_login ul on s.supervisor = ul.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            WHERE 
                s.id = $1
            ORDER BY s.created DESC`;
        const fullResult = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Salida no encontrada." });
        }

        io.emit("actualizarSalida", fullResult.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/salidas", async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id, 
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso, 
                s.horario_salida, 
                s.timestamp_salida, 
                s.timestamp_regreso, 
                ms.motivo_salida AS motivo, 
                s.created,
                s.estado,
                s.observaciones,
                TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
                ul.legajo as legajoSupervisor
            FROM 
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN usuarios_login ul on s.supervisor = ul.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            ORDER BY s.created DESC`;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/salidas/:anio/:mes", async (req, res) => {
    const { anio, mes } = req.params;
    try {
        const query = `
        SELECT
            s.id,
            s.legajo,
            TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
            s.horario_regreso,
            s.horario_salida,
            s.timestamp_salida,
            s.timestamp_regreso,
            ms.motivo_salida AS motivo,
            s.created,
            s.estado,
            s.observaciones,
            TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
            ul.legajo AS legajoSupervisor,
            LPAD(FLOOR(EXTRACT(EPOCH FROM (s.timestamp_regreso - s.timestamp_salida)) / 60)::TEXT, 2, '0') || ':' ||
            LPAD((EXTRACT(EPOCH FROM (s.timestamp_regreso - s.timestamp_salida))::INT % 60)::TEXT, 2, '0') AS duracion
        FROM
            salidas s
            JOIN usuarios u ON s.legajo = u.legajo
            JOIN usuarios_login ul ON s.supervisor = ul.legajo
            JOIN motivos_salida ms ON s.motivo_salida = ms.id
        WHERE
            EXTRACT(YEAR FROM s.created) = $1
            AND EXTRACT(MONTH FROM s.created) = $2
        ORDER BY s.created DESC`;
        /*const query = `
        SELECT
            s.id,
            s.legajo,
            TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
            s.horario_regreso,
            s.horario_salida,
            s.timestamp_salida,
            s.timestamp_regreso,
            ms.motivo_salida AS motivo,
            s.created,
            s.estado,
            s.observaciones,
            TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
            ul.legajo AS legajoSupervisor,
            CASE
                WHEN s.timestamp_salida IS NULL THEN 'Pendiente'
                WHEN s.timestamp_regreso IS NULL THEN 'Incompleto'
                ELSE COALESCE(EXTRACT(EPOCH FROM (s.timestamp_regreso - s.timestamp_salida)), 0)::TEXT
            END AS duracion_seconds,
            CASE
                WHEN s.timestamp_salida IS NULL THEN 'Pendiente'
                WHEN s.timestamp_regreso IS NULL THEN 'Incompleto'
                ELSE COALESCE(TO_CHAR(s.timestamp_regreso - s.timestamp_salida, 'HH24:MI:SS'), '00:00:00')
            END AS duracion
        FROM
            salidas s
            JOIN usuarios u ON s.legajo = u.legajo
            JOIN usuarios_login ul ON s.supervisor = ul.legajo
            JOIN motivos_salida ms ON s.motivo_salida = ms.id
        WHERE
            EXTRACT(YEAR FROM s.created) = $1
            AND EXTRACT(MONTH FROM s.created) = $2
        ORDER BY s.created DESC;
        `;*/
        const result = await pool.query(query, [anio, mes]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/salidas/supervisor-stats', async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).send('Por favor proporciona el año y el mes.');
    }

    try {
        const query = `
      WITH salida_totales AS (
          SELECT
              supervisor,
              COUNT(*) AS total_salidas
          FROM salidas
          WHERE EXTRACT(YEAR FROM created::timestamp) = $1
            AND EXTRACT(MONTH FROM created::timestamp) = $2
          GROUP BY supervisor
      ),
      motivo_porcentaje AS (
          SELECT
              supervisor,
              motivo_salida,
              COUNT(*) AS motivo_count,
              COUNT(*)::float / (SELECT total_salidas FROM salida_totales WHERE salida_totales.supervisor = salidas.supervisor) * 100 AS motivo_percentage
          FROM salidas
          WHERE EXTRACT(YEAR FROM created::timestamp) = $1
            AND EXTRACT(MONTH FROM created::timestamp) = $2
          GROUP BY supervisor, motivo_salida
      ),
      estado_porcentaje AS (
          SELECT
              supervisor,
              estado,
              COUNT(*) AS estado_count,
              COUNT(*)::float / (SELECT total_salidas FROM salida_totales WHERE salida_totales.supervisor = salidas.supervisor) * 100 AS estado_percentage
          FROM salidas
          WHERE EXTRACT(YEAR FROM created::timestamp) = $1
            AND EXTRACT(MONTH FROM created::timestamp) = $2
          GROUP BY supervisor, estado
      )
      SELECT
          mp.supervisor,
          mp.motivo_salida,
          mp.motivo_percentage,
          ep.estado,
          ep.estado_percentage
      FROM motivo_porcentaje mp
      FULL JOIN estado_porcentaje ep
      ON mp.supervisor = ep.supervisor
      ORDER BY mp.supervisor;
    `;

        const result = await pool.query(query, [year, month]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error ejecutando la consulta', error);
        res.status(500).send('Error ejecutando la consulta');
    }
});

app.get("/salidasPorSupervisor/:supervisor", async (req, res) => {
    const { supervisor } = req.params;
    try {
        const query = `
            SELECT 
                s.id, 
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso, 
                s.horario_salida, 
                s.timestamp_salida, 
                s.timestamp_regreso, 
                ms.motivo_salida AS motivo, 
                s.created,
                s.estado,
                s.observaciones
            FROM 
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            WHERE s.supervisor = $1
            ORDER BY s.created DESC`;

        const result = await pool.query(query, [supervisor]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/salidasPorSupervisor/:supervisor/:anio/:mes", async (req, res) => {
    const { supervisor, anio, mes } = req.params;
    try {
        const query = `
            SELECT 
                s.id, 
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso, 
                s.horario_salida, 
                s.timestamp_salida, 
                s.timestamp_regreso, 
                ms.motivo_salida AS motivo, 
                s.created,
                s.estado,
                s.observaciones
            FROM 
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            WHERE s.supervisor = $1
            AND EXTRACT(YEAR FROM s.timestamp_salida) = $2
            AND EXTRACT(MONTH FROM s.timestamp_salida) = $3
            ORDER BY s.created DESC`;

        const result = await pool.query(query, [supervisor, anio, mes]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/salidasDelDia", async (req, res) => {
    try {
        const query = `
            SELECT
                s.id,
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso,
                s.horario_salida,
                s.timestamp_salida,
                s.timestamp_regreso,
                ms.motivo_salida AS motivo,
                s.created,
                s.estado,
                s.observaciones,
                TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
                ul.legajo as legajoSupervisor
            FROM
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN usuarios_login ul on s.supervisor = ul.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            WHERE 
                DATE(created) = CURRENT_DATE AND
                ms.id != 6
            ORDER BY s.created DESC`;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/salidas/sinEjecutar", async (req, res) => {
    try {
        const query = `
            SELECT
                s.id,
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso,
                s.horario_salida,
                s.timestamp_salida,
                s.timestamp_regreso,
                ms.motivo_salida AS motivo,
                s.created,
                s.estado,
                s.observaciones,
                TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
                ul.legajo as legajoSupervisor
            FROM
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN usuarios_login ul on s.supervisor = ul.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            WHERE 
                s.timestamp_salida IS NULL AND s.timestamp_regreso IS NULL
            ORDER BY s.created DESC`;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/salidas/pendienteRetorno", async (req, res) => {
    try {
        const query = `
            SELECT
                s.id,
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso,
                s.horario_salida,
                s.timestamp_salida,
                s.timestamp_regreso,
                ms.motivo_salida AS motivo,
                s.created,
                s.estado,
                s.observaciones,
                TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
                ul.legajo as legajoSupervisor
            FROM
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN usuarios_login ul on s.supervisor = ul.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            WHERE 
                s.timestamp_salida IS NOT NULL AND s.timestamp_regreso IS NULL
            ORDER BY s.created DESC`;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/actualizar-empleados", async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const result =
            await sql.query`SELECT p.nro_leg, p.apellido, p.nombre, p.estado, u.descripcion FROM personal p JOIN ubic_fisicas u ON p.ubic_fisica = u.ubic_fisica`;
        for (let empleado of result.recordset) {
            const { nro_leg, apellido, nombre, estado, descripcion } = empleado;
            const resPg = await pool.query(
                "SELECT * FROM usuarios WHERE legajo = $1",
                [nro_leg]
            );
            if (resPg.rows.length > 0) {
                await pool.query(
                    "UPDATE usuarios SET nombre = $1, apellido = $2, estado = $3, ubicacion = $5 WHERE legajo = $4",
                    [nombre, apellido, estado, nro_leg, descripcion]
                );
            } else {
                await pool.query(
                    "INSERT INTO usuarios (nombre, apellido, legajo, estado, ubicacion) VALUES ($1, $2, $3, $4, $5)",
                    [nombre, apellido, nro_leg, estado, descripcion]
                );
            }
        }
        res.send("Actualización completada");
    } catch (err) {
        console.error("Error al actualizar empleados", err);
        res.status(500).send("Ocurrió un error al actualizar los empleados");
    } finally {
        await sql.close();
    }
});

app.get("/usuarios/empleado", async (req, res) => {
    try {
        const query = "SELECT * FROM usuarios WHERE estado = $1";
        const valores = ["ACTI"];
        const result = await pool.query(query, valores);
        const usuariosLimpios = result.rows.map((usuario) => ({
            ...usuario,
            nombre: usuario.nombre.trim(),
            apellido: usuario.apellido.trim(),
        }));
        res.json(usuariosLimpios);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/motivos", async (req, res) => {
    try {
        const query = "SELECT * FROM motivos_salida";
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/salidas/finalizar/:id", async (req, res) => {
    const { id } = req.params;
    const { observaciones } = req.body;

    if (observaciones.length < 10) {
        return res
            .status(400)
            .json({ error: "Las observaciones deben tener al menos 10 caracteres." });
    }
    try {
        await pool.query(
            "UPDATE salidas SET observaciones = $1, estado = Finalizado WHERE id = $2",
            [observaciones, id]
        );
        res.status(200).json({ message: "Salida finalizada con éxito." });
    } catch (err) {
        console.error("Error al finalizar la salida:", err);
        res.status(500).json({ error: "Error al procesar la solicitud." });
    }
});

app.get("/salidas/usuario/:legajo/:anio/:mes", async (req, res) => {
    const { legajo, anio, mes } = req.params;
    try {
        const query = `
        SELECT
            s.id,
            TRIM(u.nombre) AS nombre_usuario,
            TRIM(u.apellido) AS apellido_usuario,
            s.legajo,
            s.horario_salida,
            s.horario_regreso,
            s.timestamp_salida,
            s.timestamp_regreso,
            ms.motivo_salida,
            s.observaciones,
            COALESCE(s.estado, 'activo') AS estado,
            EXTRACT(EPOCH FROM (s.timestamp_regreso - s.timestamp_salida)) AS duracion_segundos
        FROM
            salidas s
        JOIN
            motivos_salida ms ON s.motivo_salida = ms.id
        JOIN
            usuarios u ON s.legajo = u.legajo
        WHERE
            s.legajo = $1
        AND EXTRACT(YEAR FROM s.timestamp_salida) = $2
        AND EXTRACT(MONTH FROM s.timestamp_salida) = $3;
        `;
        const result = await pool.query(query, [legajo, anio, mes]);
        const resumen = result.rows.map((row) => {
            const segundos = parseInt(row.duracion_segundos);
            const horas = Math.floor(segundos / 3600);
            const minutos = Math.floor((segundos % 3600) / 60);
            const segundosRestantes = segundos % 60;
            const duracionFormato = `${horas}h ${minutos}m ${segundosRestantes}s`;

            return {
                id: row.id,
                nombre: row.nombre_usuario,
                apellido: row.apellido_usuario,
                legajo: row.legajo,
                horarioSalida: row.horario_salida,
                horarioRegreso: row.horario_regreso,
                duracionHoras: duracionFormato,
                motivoSalida: row.motivo_salida,
                estado: row.estado,
                observaciones: row.observaciones
            };
        });
        res.json(resumen);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

app.get("/salidas/supervisor/:anio/:mes", async (req, res) => {
    const { anio, mes } = req.params;
    try {
        const query = `
        SELECT supervisor, COUNT(*) AS total_salidas,
            SUM(EXTRACT(EPOCH FROM (s.timestamp_regreso - s.timestamp_salida))) AS total_segundos,
            CONCAT(l.nombre, ' ', l.apellido) AS nombre
        FROM salidas s
        JOIN usuarios_login l ON s.supervisor = l.legajo
        WHERE s.estado = 'Finalizado'
            AND EXTRACT(YEAR FROM s.timestamp_salida) = $1
            AND EXTRACT(MONTH FROM s.timestamp_salida) = $2
        GROUP BY s.supervisor, l.nombre, l.apellido;`;
        const result = await pool.query(query, [anio, mes]);
        const resumen = result.rows.map((row) => {
            const segundos = parseInt(row.total_segundos);
            const horas = Math.floor(segundos / 3600);
            const minutos = Math.floor((segundos % 3600) / 60);
            const segundosRestantes = segundos % 60;
            const duracionFormato = `${horas}h ${minutos}m ${segundosRestantes}s`;

            return {
                supervisor: row.supervisor,
                nombre: row.nombre,
                totalSalidas: parseInt(row.total_salidas),
                totalHoras: duracionFormato,
            };
        });
        res.json(resumen);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

app.get("/salidas/salidasSupervisorConsultorio", async (req, res) => {
    const { anio, mes } = req.query;
    try {
        const query = `
            SELECT s.nombre, s.apellido,
                justify_interval(SUM(sa.timestamp_regreso - sa.timestamp_salida)) AS total_horas
            FROM salidas sa
            JOIN usuarios_login s ON sa.supervisor = s.legajo
            JOIN motivos_salida m ON sa.motivo_salida = m.id
            WHERE m.id = 6
            AND EXTRACT(MONTH FROM sa.timestamp_salida) = $2
            AND EXTRACT(YEAR FROM sa.timestamp_salida) = $1
            GROUP BY s.nombre, s.apellido;
        `;
        const result = await pool.query(query, [anio, mes]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/salidas/salidasSupervisorMesAnio", async (req, res) => {
    const { anio, mes } = req.query;
    try {
        const query = `
            SELECT s.nombre, s.apellido,
                COUNT(sa.id) AS total_salidas,
                justify_interval(SUM(sa.timestamp_regreso - sa.timestamp_salida)) AS total_horas
            FROM salidas sa
            JOIN usuarios_login s ON sa.supervisor = s.legajo
            WHERE EXTRACT(MONTH FROM sa.timestamp_salida) = $1
            AND EXTRACT(YEAR FROM sa.timestamp_salida) = $2
            GROUP BY s.nombre, s.apellido;
        `;
        const result = await pool.query(query, [mes, anio]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/salidas/salidasTipoMesAnio", async (req, res) => {
    const { anio, mes } = req.query;
    try {
        const query = `
            SELECT
            m.motivo_salida,
                COUNT(sa.id) AS total_salidas,
                justify_interval(SUM(sa.timestamp_regreso - sa.timestamp_salida)) AS total_horas
            FROM salidas sa
            JOIN motivos_salida m ON sa.motivo_salida = m.id
            WHERE EXTRACT(MONTH FROM sa.timestamp_salida) = $1
            AND EXTRACT(YEAR FROM sa.timestamp_salida) = $2
            GROUP BY m.motivo_salida;
        `;
        const result = await pool.query(query, [mes, anio]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/salidas/consultorioMedicoInterno", async (req, res) => {
    try {
        const query = `
            SELECT
                s.id,
                TRIM(u.nombre) || ' ' || TRIM(u.apellido) AS nombre_completo,
                s.horario_regreso,
                s.horario_salida,
                s.timestamp_salida,
                s.timestamp_regreso,
                ms.motivo_salida AS motivo,
                s.created,
                s.estado,
                TRIM(ul.nombre) || ' ' || TRIM(ul.apellido) AS supervisor,
                ul.legajo as legajoSupervisor
            FROM
                salidas s
                JOIN usuarios u ON s.legajo = u.legajo
                JOIN usuarios_login ul on s.supervisor = ul.legajo
                JOIN motivos_salida ms ON s.motivo_salida = ms.id
            WHERE 
                DATE(created) = CURRENT_DATE AND
                ms.id = 6
            ORDER BY s.created DESC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/actualizar-salidas', async (req, res) => {
    try {
        const query = `
            UPDATE salidas
            SET estado = CASE
                WHEN estado = 'Activo' THEN 'Finalizado incompleto'
                WHEN estado = 'Pendiente' THEN 'Cancelado'
                ELSE estado
            END
            WHERE DATE(created) IN (CURRENT_DATE, CURRENT_DATE - INTERVAL '1 DAY');
        `;

        await pool.query(query);
        res.status(200).json({ message: 'Estados de salidas actualizados correctamente.' });
    } catch (err) {
        console.error('Error al actualizar estados de salidas:', err, new Date().toISOString());
        res.status(500).json({ error: 'Error al procesar la solicitud.' });
    }
});

app.get('/datosSalidas', async (req, res) => {
    try {
        const { mes, anio } = req.query;
        const query = `
        WITH sd AS (
            SELECT
            su.nombre        AS sup_nombre,
            su.apellido      AS sup_apellido,
            ms.motivo_salida        AS motivo_nombre,
            (EXTRACT(EPOCH FROM (s.timestamp_regreso - s.timestamp_salida)) / 3600) AS horas
            FROM salidas s
            JOIN usuarios_login su 
            ON s.supervisor = su.legajo
            JOIN motivos_salida ms
            ON s.motivo_salida = ms.id
            WHERE EXTRACT(MONTH FROM s.timestamp_salida) = $1
            AND EXTRACT(YEAR FROM s.timestamp_salida)  = $2
        ),
        supervisor_stats AS (
            SELECT
            sup_nombre,
            sup_apellido,
            COUNT(*) AS total_salidas,
            SUM(horas) AS total_horas
            FROM sd
            GROUP BY sup_nombre, sup_apellido
        ),
        tipo_stats AS (
            SELECT
            sup_nombre,
            sup_apellido,
            motivo_nombre,
            COUNT(*) AS count_tipo,
            SUM(horas) AS horas_tipo
            FROM sd
            GROUP BY sup_nombre, sup_apellido, motivo_nombre
        )
        SELECT
            ss.sup_nombre,
            ss.sup_apellido,
            ss.total_salidas,
            ss.total_horas,
            COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                'tipo',        ts.motivo_nombre,
                'count',       ts.count_tipo,
                'total_horas', ts.horas_tipo
                )
            ) FILTER (WHERE ts.motivo_nombre IS NOT NULL),
            '[]'::json
            ) AS tipos_salidas
        FROM supervisor_stats ss
        LEFT JOIN tipo_stats ts
            ON ss.sup_nombre = ts.sup_nombre
            AND ss.sup_apellido = ts.sup_apellido
        GROUP BY
            ss.sup_nombre,
            ss.sup_apellido,
            ss.total_salidas,
            ss.total_horas
        ORDER BY
            ss.sup_nombre,
            ss.sup_apellido;
    `;

        const result = await pool.query(query, [mes, anio]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

app.post("/autorizaciones", async (req, res) => {
    const { legajo_empleado, tipo, motivo, creador } = req.body;

    // 1) Validar empleado
    try {
        const emp = await pool.query(
            "SELECT estado FROM usuarios WHERE legajo = $1",
            [legajo_empleado]
        );
        if (!emp.rows.length) {
            return res.status(404).json({ error: "Colaborador no encontrado" });
        }
        const estEmp = emp.rows[0].estado.trim().toUpperCase();
        if (estEmp === "INAC") {
            return res
                .status(400)
                .json({ error: "El colaborador no pertenece a planta" });
        }
    } catch (err) {
        console.error("Error validando empleado:", err);
        return res.status(500).json({ error: err.message });
    }

    // 2) Validar supervisor
    try {
        const sup = await pool.query(
            "SELECT estado FROM usuarios_login WHERE legajo = $1",
            [creador]
        );
        if (!sup.rows.length) {
            return res.status(400).json({ error: "Supervisor no encontrado" });
        }
        const estSup = sup.rows[0].estado.trim().toUpperCase();
        if (estSup === "INAC") {
            return res
                .status(400)
                .json({ error: "El supervisor no pertenece a planta" });
        }
    } catch (err) {
        console.error("Error validando supervisor:", err);
        return res.status(500).json({ error: err.message });
    }

    // 3) Bloquear auto‑autorización: colaborador y supervisor no pueden ser el mismo
    if (legajo_empleado.trim() === creador.trim()) {
        return res
            .status(400)
            .json({ error: "El supervisor no puede autorizarse a sí mismo" });
    }

    // 4) Verificar que no haya ya una autorización PENDIENTE para este colaborador
    try {
        // Query más robusta: trim + uppercase
        const pend = await pool.query(
            `SELECT *
            FROM autorizaciones
            WHERE legajo_empleado = $1
            AND UPPER(TRIM(estado)) = 'PENDIENTE'`,
            [legajo_empleado]
        );
        console.log("Pendientes encontradas:", pend.rows); // <-- para debugging

        if (pend.rows.length > 0) {
            return res
                .status(400)
                .json({ error: "El colaborador tiene una autorización pendiente" });
        }
    } catch (err) {
        console.error("Error validando autorizaciones pendientes:", err);
        return res.status(500).json({ error: err.message });
    }

    // 5) Insertar nueva autorización
    try {
        const { rows } = await pool.query(
            `INSERT INTO autorizaciones
            (legajo_empleado, legajo_supervisor, tipo, motivo)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (legajo_empleado)
            WHERE ((estado)::text = 'PENDIENTE'::text)
             DO NOTHING
        RETURNING *;`,
            [legajo_empleado, creador, tipo, motivo]
        );

        if (rows.length === 0) {
            // Ya existía una PENDIENTE, no se insertó nada
            return res
                .status(400)
                .json({ error: "El colaborador tiene una autorización pendiente" });
        }

        // Se insertó OK
        const nueva = rows[0];
        io.emit("nuevaAutorizacion", nueva);
        return res.status(201).json(nueva);

    } catch (err) {
        console.error("Error inesperado al crear autorización:", err);
        return res
            .status(500)
            .json({ error: "Ocurrió un error inesperado al crear la autorización" });
    }

});

app.get("/autorizaciones", async (req, res) => {
    const { tipo, estado } = req.query;
    const condiciones = [];
    const params = [];
    let idx = 1;

    if (tipo) {
        condiciones.push(`a.tipo = $${idx++}`);
        params.push(tipo);
    }
    if (estado) {
        condiciones.push(`a.estado = $${idx++}`);
        params.push(estado);
    }

    const whereClause = condiciones.length
        ? "WHERE " + condiciones.join(" AND ")
        : "";

    const query = `
    SELECT
      a.*,
      TRIM(uE.nombre) || ' ' || TRIM(uE.apellido) AS empleado_nombre,
      TRIM(uS.nombre) || ' ' || TRIM(uS.apellido) AS supervisor_nombre,
      -- si es SALIDA tomamos de motivos_salida, si es INGRESO de motivos_ingreso
      CASE
        WHEN a.tipo = 'SALIDA' THEN ms.motivo_salida
        ELSE mi.motivo_salida
      END AS motivo_desc
    FROM autorizaciones a
      JOIN usuarios       uE ON a.legajo_empleado   = uE.legajo
      JOIN usuarios       uS ON a.legajo_supervisor = uS.legajo
      LEFT JOIN motivos_salida  ms ON a.tipo = 'SALIDA' AND a.motivo = ms.id
      LEFT JOIN motivos_ingreso mi ON a.tipo = 'INGRESO' AND a.motivo = mi.id
    ${whereClause}
    ORDER BY a.solicitado_en DESC`;

    try {
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error listando autorizaciones:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put("/autorizaciones/:id", async (req, res) => {
    const { id } = req.params;
    const { estado, respondido_por } = req.body;
    const respondido_en = new Date();

    try {
        const { rows } = await pool.query(
            `UPDATE autorizaciones
         SET estado        = $1,
             respondido_por = $2,
             respondido_en  = $3
       WHERE id = $4
       RETURNING *`,
            [estado, respondido_por, respondido_en, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Autorización no encontrada" });
        }
        const actualizada = rows[0];
        io.emit("autorizacionActualizada", actualizada);
        res.json(actualizada);
    } catch (err) {
        console.error("Error actualizando autorización:", err);
        res.status(500).json({ error: err.message });
    }
});



const port = process.env.PORT || 4060;

server.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

cron.schedule('0 0 * * *', async () => {
    try {
        const response = await fetch(`http://localhost:${port}/actualizar-salidas`, { method: 'PUT' });
        const data = await response.json();
        console.log(data.message);
    } catch (error) {
        console.error('Error al ejecutar cron job:', error);
    }
});

