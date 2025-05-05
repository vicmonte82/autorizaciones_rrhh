// src/components/ListaAutorizacionesRRHH.jsx
import React, { useEffect, useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Typography,
    TablePagination, Box
} from '@mui/material';
import axios from 'axios';
import config from './config';
import { formatDate } from './timeUtils';

export default function ListaAutorizacionesRRHH({ anio, mes }) {
    const [auths, setAuths] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRows] = useState(20);

    useEffect(() => {
        axios.get(`${config.apiBaseUrl}/autorizaciones`, {
            params: { tipo: 'INGRESO' }
        })
            .then(res => {
                // filtrar por año/mes de "solicitado_en"
                const filtered = res.data.filter(a => {
                    const d = new Date(a.solicitado_en);
                    return d.getFullYear() === +anio && (d.getMonth() + 1) === +mes;
                });
                setAuths(filtered);
            })
            .catch(err => console.error("Error cargando autorizaciones:", err));
    }, [anio, mes]);

    const handleChangePage = (_, p) => setPage(p);
    const handleChangeRows = e => { setRows(+e.target.value); setPage(0); };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
                Autorizaciones de Ingreso ({String(mes).padStart(2, '0')}/{anio})
            </Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Legajo</TableCell>
                            <TableCell>Empleado</TableCell>
                            <TableCell>Motivo</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Solicitado</TableCell>
                            <TableCell>Respondido En</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {auths
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map(a => (
                                <TableRow key={a.id}>
                                    <TableCell>{a.id}</TableCell>
                                    <TableCell>{a.legajo_empleado}</TableCell>
                                    <TableCell>{a.empleado_nombre}</TableCell>
                                    <TableCell>{a.motivo_desc}</TableCell>
                                    <TableCell>{a.estado}</TableCell>
                                    <TableCell>{formatDate(a.solicitado_en)}</TableCell>
                                    <TableCell>{formatDate(a.respondido_en)}</TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={auths.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRows}
                    rowsPerPageOptions={[10, 20, 50]}
                />
            </TableContainer>
        </Box>
    );
}
