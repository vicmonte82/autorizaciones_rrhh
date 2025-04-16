import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, TablePagination } from '@mui/material';
import axios from 'axios';
import socketIOClient from 'socket.io-client';
import config from './config';

const socket = socketIOClient(config.apiBaseUrl);

const ListaSalidasSupervisor = ({ rol, legajo }) => {
    const [salidas, setSalidas] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const userRol = rol;
    const userLegajo = legajo;

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    useEffect(() => {
        socket.on('nuevaSalida', (nuevaSalidaCompleta) => {
            if (nuevaSalidaCompleta.legajosupervisor === userLegajo) {
                setSalidas(prevSalidas => [nuevaSalidaCompleta, ...prevSalidas]);
            }
        });
        return () => socket.off('nuevaSalida');
    }, [userRol, userLegajo]);

    useEffect(() => {
        socket.on('actualizarSalida', (salidaActualizada) => {
            setSalidas(prevSalidas => {
                const index = prevSalidas.findIndex(salida => salida.id === salidaActualizada.id);
                if (salidaActualizada.legajosupervisor === userLegajo) {
                    if (index !== -1) {
                        return [
                            ...prevSalidas.slice(0, index),
                            salidaActualizada,
                            ...prevSalidas.slice(index + 1)
                        ];
                    } else {
                        return [...prevSalidas, salidaActualizada];
                    }
                } else {
                    return prevSalidas;
                }
            });
        });
        return () => socket.off('actualizarSalida');
    }, [userRol, userLegajo]);

    useEffect(() => {
        const getSalidas = async () => {
            try {
                const response = await axios.get(`${config.apiBaseUrl}/salidasPorSupervisor/${userLegajo}`);
                console.log("legajo supervisor: ", userLegajo)
                setSalidas(response.data);
            } catch (error) {
                console.error('Error al obtener las salidas:', error);
            }
        }
        getSalidas();
    }, [userRol, userLegajo]);

    useEffect(() => {
        socket.on('actualizarSalida', (salidaActualizada) => {
            if (salidaActualizada.supervisor === userLegajo) {
                setSalidas(prevSalidas => prevSalidas.map(salida =>
                    salida.id === salidaActualizada.id ? salidaActualizada : salida
                ));
            } else {
                setSalidas(prevSalidas => prevSalidas.map(salida =>
                    salida.id === salidaActualizada.id ? salidaActualizada : salida));
            }
        });
        return () => socket.off('actualizarSalida');
    }, [userRol, userLegajo]);

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
                            <TableCell align="left">Fecha</TableCell>
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
                                <TableCell align="left">
                                    {new Date(salida.created).toLocaleDateString('es-ES')}
                                </TableCell>
                                <TableCell align="left">{salida.estado}</TableCell>
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

export default ListaSalidasSupervisor;
