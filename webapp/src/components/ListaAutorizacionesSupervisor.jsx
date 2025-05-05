import React, { useEffect, useState } from "react";
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Box,
    TextField
} from "@mui/material";
import axios from "axios";
import socketIOClient from "socket.io-client";
import config from "./config";

const socket = socketIOClient(config.apiBaseUrl);

const formatDate = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}-${mm}-${yy} ${hh}:${mi}:${ss}`;
};

export default function ListaAutorizacionesSupervisor({ legajo }) {
    const [autorizaciones, setAutorizaciones] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // 1) Fetch inicial
    useEffect(() => {
        axios
            .get(`${config.apiBaseUrl}/autorizaciones`, {
                params: { tipo: "INGRESO", legajo_supervisor: legajo }
            })
            .then((res) => setAutorizaciones(res.data))
            .catch((err) => console.error("Error cargando autorizaciones:", err));
    }, [legajo]);

    // 2) Socket.IO
    useEffect(() => {
        const handleNew = (a) => {
            if (a.tipo === "INGRESO" && a.legajo_supervisor === legajo) {
                setAutorizaciones((prev) => [a, ...prev]);
            }
        };
        const handleUpdate = (a) => {
            if (a.legajo_supervisor === legajo) {
                setAutorizaciones((prev) =>
                    prev.map((x) => (x.id === a.id ? a : x))
                );
            }
        };

        socket.on("nuevaAutorizacion", handleNew);
        socket.on("autorizacionActualizada", handleUpdate);
        return () => {
            socket.off("nuevaAutorizacion", handleNew);
            socket.off("autorizacionActualizada", handleUpdate);
        };
    }, [legajo]);

    // Filtrar por legajo o nombre
    const filtered = autorizaciones.filter((a) => {
        const term = searchTerm.toLowerCase();
        return (
            a.legajo_empleado.includes(term) ||
            a.empleado_nombre.toLowerCase().includes(term)
        );
    });

    return (
        <Box>
            <TextField
                label="Buscar por legajo o nombre"
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mb: 2 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Legajo</TableCell>
                            <TableCell>Nombre Empleado</TableCell>
                            <TableCell>Motivo</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Solicitado</TableCell>
                            <TableCell>Autorizado En</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((a) => (
                            <TableRow key={a.id}>
                                <TableCell>{a.id}</TableCell>
                                <TableCell>{a.legajo_empleado}</TableCell>
                                <TableCell>{a.empleado_nombre}</TableCell>
                                <TableCell>{a.motivo_desc}</TableCell>
                                <TableCell>{a.estado}</TableCell>
                                <TableCell>{formatDate(a.solicitado_en)}</TableCell>
                                <TableCell>{formatDate(a.respondido_en)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
