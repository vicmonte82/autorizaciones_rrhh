import React, { useEffect, useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button,
    Box, Typography, TablePagination, Divider
} from '@mui/material';
import axios from 'axios';
import socketIOClient from 'socket.io-client';
import config from './config';

const socket = socketIOClient(config.apiBaseUrl);

// formatea fechas DD-MM-YY HH:MM:SS
const formatDate = iso => {
    if (!iso) return '-';
    const d = new Date(iso);
    return (
        `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getFullYear()).slice(-2)} ` +
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    );
};

// Comprueba si una ISO date es del mismo día que hoy
const isSameDay = iso => {
    const d1 = new Date(iso), d2 = new Date();
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
};

const ListaSalidasVigilancia = ({ rol, legajo }) => {
    // --- Estado salidas ---
    const [salidas, setSalidas] = useState([]);
    const [pageSal, setPageSal] = useState(0);
    const [rowsSal, setRowsSal] = useState(20);

    // --- Estado autorizaciones ---
    const [autorizaciones, setAutorizaciones] = useState([]);
    const [pageAuth, setPageAuth] = useState(0);
    const [rowsAuth, setRowsAuth] = useState(20);

    // 1) Fetch inicial
    useEffect(() => {
        (async () => {
            try {
                const [rSal, rAuth] = await Promise.all([
                    axios.get(`${config.apiBaseUrl}/salidasDelDia`),
                    axios.get(`${config.apiBaseUrl}/autorizaciones`, {
                        params: { tipo: 'INGRESO' }
                    })
                ]);
                setSalidas(rSal.data.filter(s => s.motivo !== 'Consultorio Médico Interno'));
                setAutorizaciones(rAuth.data);
            } catch (e) {
                console.error('Error fetch inicial:', e);
            }
        })();
    }, []);

    // 2) Socket → Salidas
    useEffect(() => {
        socket.on('nuevaSalida', s => {
            if (s.motivo === 'Consultorio Médico Interno') return;
            if (!s.nombre_completo || !s.motivo) {
                axios.get(`${config.apiBaseUrl}/salidas/${s.id}`)
                    .then(res => setSalidas(prev => [res.data, ...prev]))
                    .catch(console.error);
            } else {
                setSalidas(prev => [s, ...prev]);
            }
        });
        socket.on('actualizarSalida', s =>
            setSalidas(prev => prev.map(x => x.id === s.id ? s : x))
        );
        return () => {
            socket.off('nuevaSalida');
            socket.off('actualizarSalida');
        };
    }, []);

    // 3) Socket → Autorizaciones
    useEffect(() => {
        socket.on('nuevaAutorizacion', a => {
            if (a.tipo !== 'INGRESO') return;
            if (!a.empleado_nombre || !a.motivo_desc) {
                axios.get(`${config.apiBaseUrl}/autorizaciones/${a.id}`)
                    .then(res => setAutorizaciones(prev => [res.data, ...prev]))
                    .catch(console.error);
            } else {
                setAutorizaciones(prev => [a, ...prev]);
            }
        });
        socket.on('autorizacionActualizada', a =>
            setAutorizaciones(prev => prev.map(x => x.id === a.id ? a : x))
        );
        return () => {
            socket.off('nuevaAutorizacion');
            socket.off('autorizacionActualizada');
        };
    }, []);

    // 4) Paginaciones
    const handleChangePageSal = (_, p) => setPageSal(p);
    const handleChangeRowsSal = e => { setRowsSal(+e.target.value); setPageSal(0); };
    const handleChangePageAuth = (_, p) => setPageAuth(p);
    const handleChangeRowsAuth = e => { setRowsAuth(+e.target.value); setPageAuth(0); };

    // 5) Salidas actions
    const handleEgreso = async (id, obs) => {
        try {
            await axios.put(`${config.apiBaseUrl}/salidas/egreso/${id}`);
            if (obs === "sin retorno") {
                await axios.put(`${config.apiBaseUrl}/salidas/regreso/${id}`);
            }
        } catch (e) {
            console.error('Error egreso:', e);
        }
    };
    const handleRegreso = async id => {
        try {
            await axios.put(`${config.apiBaseUrl}/salidas/regreso/${id}`);
        } catch (e) {
            console.error('Error regreso:', e);
        }
    };

    // 6) Autorizaciones action
    const handleAutorizar = async id => {
        try {
            const { data } = await axios.put(
                `${config.apiBaseUrl}/autorizaciones/${id}`,
                { estado: 'AUTORIZADO', respondido_por: legajo }
            );
            // reemplazo la fila con el objeto completo
            setAutorizaciones(prev => prev.map(a => a.id === data.id ? data : a));
        } catch (e) {
            console.error("Error al autorizar:", e.response?.data || e);
            alert(e.response?.data?.error || "No se pudo autorizar");
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            {/* -- Salidas -- */}
            <Typography variant="h6" gutterBottom>
                Salidas Pendientes
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Empleado</TableCell>
                            <TableCell>Motivo</TableCell>
                            <TableCell>Salida</TableCell>
                            <TableCell>Regreso</TableCell>
                            <TableCell>Supervisor</TableCell>
                            <TableCell>Acción</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {salidas
                            .slice(pageSal * rowsSal, pageSal * rowsSal + rowsSal)
                            .map(s => (
                                <TableRow key={s.id}>
                                    <TableCell>{s.nombre_completo}</TableCell>
                                    <TableCell>{s.motivo}</TableCell>
                                    <TableCell>{s.horario_salida || '-'}</TableCell>
                                    <TableCell>{s.horario_regreso || '-'}</TableCell>
                                    <TableCell>{s.supervisor}</TableCell>
                                    <TableCell>
                                        {s.horario_salida == null ? (
                                            <Button size="small" variant="contained" onClick={() => handleEgreso(s.id, s.observaciones)}>
                                                Marcar Egreso
                                            </Button>
                                        ) : s.horario_regreso == null ? (
                                            <Button size="small" variant="contained" color="secondary" onClick={() => handleRegreso(s.id)}>
                                                Marcar Regreso
                                            </Button>
                                        ) : (
                                            s.estado
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={salidas.length}
                    page={pageSal}
                    rowsPerPage={rowsSal}
                    onPageChange={handleChangePageSal}
                    onRowsPerPageChange={handleChangeRowsSal}
                    rowsPerPageOptions={[10, 20, 50]}
                />
            </TableContainer>

            <Divider sx={{ my: 4 }} />

            {/* -- Autorizaciones -- */}
            <Typography variant="h6" gutterBottom>
                Autorizaciones de Ingreso
            </Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Empleado</TableCell>
                            <TableCell>Motivo</TableCell>
                            <TableCell>Solicitado</TableCell>
                            <TableCell>Acción / Estado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {autorizaciones
                            .slice(pageAuth * rowsAuth, pageAuth * rowsAuth + rowsAuth)
                            .map(a => {
                                const canAuthorize = isSameDay(a.solicitado_en);
                                return (
                                    <TableRow key={a.id}>
                                        <TableCell>{a.empleado_nombre}</TableCell>
                                        <TableCell>{a.motivo_desc}</TableCell>
                                        <TableCell>{formatDate(a.solicitado_en)}</TableCell>
                                        <TableCell>
                                            {a.estado === 'PENDIENTE' ? (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => handleAutorizar(a.id)}
                                                    disabled={!canAuthorize}
                                                >
                                                    Autorizar
                                                </Button>
                                            ) : (
                                                <Typography>{a.estado}</Typography>
                                            )}
                                            {!canAuthorize && a.estado === 'PENDIENTE' && (
                                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                    Sólo hoy
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={autorizaciones.length}
                    page={pageAuth}
                    rowsPerPage={rowsAuth}
                    onPageChange={handleChangePageAuth}
                    onRowsPerPageChange={handleChangeRowsAuth}
                    rowsPerPageOptions={[10, 20, 50]}
                />
            </TableContainer>
        </Box>
    );
};

export default ListaSalidasVigilancia;
