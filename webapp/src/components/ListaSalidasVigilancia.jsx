import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Typography, TablePagination } from '@mui/material';
import axios from 'axios';
import socketIOClient from 'socket.io-client';
import config from './config';

const socket = socketIOClient(config.apiBaseUrl);

const ListaSalidasVigilancia = ({ rol, legajo }) => {
    const [salidas, setSalidas] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const userRol = rol
    const userLegajo = legajo

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    useEffect(() => {
        socket.on('nuevaSalida', (nuevaSalidaCompleta) => {
            if (nuevaSalidaCompleta.motivo !== "Consultorio Médico Interno") {
                setSalidas(prevSalidas => [nuevaSalidaCompleta, ...prevSalidas]);
            }
        });
        return () => socket.off('nuevaSalida');
    }, [userRol, userLegajo]);

    useEffect(() => {
        socket.on('actualizarSalida', (salidaActualizada) => {
            if (salidaActualizada.motivo !== "Consultorio Médico Interno"){
                setSalidas(prevSalidas => {
                    const index = prevSalidas.findIndex(salida => salida.id === salidaActualizada.id);
                    if (index !== -1) {
                        return [
                            ...prevSalidas.slice(0, index),
                            salidaActualizada,
                            ...prevSalidas.slice(index + 1)
                        ];
                    } else {
                        return [...prevSalidas, salidaActualizada];
                    }
                });
            }
        });
        return () => socket.off('actualizarSalida');
    }, [userRol, userLegajo]);


    useEffect(() => {
        const getSalidas = async () => {
            try {
                const response = await axios.get(`${config.apiBaseUrl}/salidasDelDia`);
                setSalidas(response.data);
            } catch (error) {
                console.error('Error al obtener las salidas:', error);
            }
        }
        getSalidas();
    }, [userRol, userLegajo]);

    useEffect(() => {
        socket.on('actualizarSalida', (salidaActualizada) => {
            if (salidaActualizada.motivo !== "Consultorio Médico Interno") {
                setSalidas(prevSalidas => prevSalidas.map(salida =>
                    salida.id === salidaActualizada.id ? salidaActualizada : salida));
            }
        });
        return () => socket.off('actualizarSalida');
    }, [userRol, userLegajo]);

    const handleEgreso = async (id, observaciones) => {
        try {
            const response = await axios.put(`${config.apiBaseUrl}/salidas/egreso/${id}`);
            console.log(response.data);
        } catch (error) {
            console.error('Error al marcar el egreso:', error);
        }
        if (observaciones === "sin retorno") {
            try {
                const response = await axios.put(`${config.apiBaseUrl}/salidas/regreso/${id}`);
                console.log(response.data);
            } catch (error) {
                console.error('Error al marcar el regreso:', error);
            }
        }
    };

    const handleRegreso = async (id) => {
        try {
            const response = await axios.put(`${config.apiBaseUrl}/salidas/regreso/${id}`);
            console.log(response.data);
        } catch (error) {
            console.error('Error al marcar el regreso:', error);
        }
    };

    return (
        <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6" gutterBottom>
                Lista de Salidas
            </Typography>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="tabla de salidas">
                    <TableHead>
                        <TableRow>
                            <TableCell align="left">Empleado</TableCell>
                            <TableCell align="left">Motivo</TableCell>
                            <TableCell align="left">Hora de Salida</TableCell>
                            <TableCell align="left">Hora de Regreso</TableCell>
                            <TableCell align="left">Supervisor</TableCell>
                            <TableCell align="left">Estado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(rowsPerPage > 0
                            ? salidas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            : salidas
                        ).map((salida) => (
                            <TableRow key={salida.id}>
                                <TableCell align="left">{salida.nombre_completo}</TableCell>
                                <TableCell align="left">{salida.motivo}</TableCell>
                                <TableCell align="left">{salida.horario_salida}</TableCell>
                                <TableCell align="left">{salida.horario_regreso}</TableCell>
                                <TableCell align="left">{salida.supervisor}</TableCell>
                                <TableCell align="left">
                                    {salida.horario_salida == null ? (
                                        <Button variant="contained" color="primary" onClick={() => handleEgreso(salida.id, salida.observaciones)}>Marcar Egreso</Button>
                                    ) : salida.horario_regreso == null ? (
                                        <Button variant="contained" color="secondary" onClick={() => handleRegreso(salida.id)}>Marcar Regreso</Button>
                                    ) : (
                                        salida.estado
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 20, 30]}
                component="div"
                count={salidas.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Box>
    );
};

export default ListaSalidasVigilancia;
