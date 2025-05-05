import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Typography,
    IconButton,
    Collapse
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

import ExportarExcelResumen from './ExportarExcelResumen';
import Estadisticas from './Estadisticas';

import { decimalHoursToDDHHMMSSMS } from './timeUtils';

import config from "./config";



function Row({ supervisor }) {
    const [open, setOpen] = useState(false);

    const renderTiposSalidas = () => {
        if (!supervisor.tipos_salidas || supervisor.tipos_salidas.length === 0) {
            return <Typography variant="body2" sx={{ ml: 2 }}>No hay detalle</Typography>;
        }

        return (
            <Table size="small" aria-label="detalle tipos de salida" sx={{ ml: 4, mb: 2 }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Tipo de Salida</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Duración Total (h)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {supervisor.tipos_salidas.map((ts, i) => (
                        <TableRow key={i}>
                            <TableCell>{ts.tipo}</TableCell>
                            <TableCell>{ts.count}</TableCell>
                            <TableCell>{decimalHoursToDDHHMMSSMS(ts.total_horas)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <>
            <TableRow>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                    {`${supervisor.sup_nombre} ${supervisor.sup_apellido}`}
                </TableCell>
                <TableCell>{supervisor.total_salidas}</TableCell>
                <TableCell>
                    {decimalHoursToDDHHMMSSMS(supervisor.total_horas)}
                </TableCell>
            </TableRow>

            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        {renderTiposSalidas()}
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

function ResumenSupervisoresGlobal({ anio, mes }) {
    const [datosSupervisores, setDatosSupervisores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);

    useEffect(() => {
        const fetchResumen = async () => {
            setLoading(true);
            try {
                // Ajusta la URL al endpoint
                const response = await axios.get(
                    `${config.apiBaseUrl}/datosSalidas?mes=${mes}&anio=${anio}`
                );
                setDatosSupervisores(response.data);
            } catch (error) {
                console.error('Error al obtener resumen de supervisores:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResumen();
    }, [anio, mes]);

    if (mostrarEstadisticas) {
        return (
            <Estadisticas
                anio={anio}
                mes={mes}
                onClose={() => setMostrarEstadisticas(false)}
            />
        );
    }

    return (
        <Box sx={{ width: '100%', margin: '0 auto' }}>
            <Card raised sx={{ width: '100%' }}>
                <CardHeader
                    title="Resumen General por Supervisor"
                    subheader="Cantidad de Salidas y Duración Total"
                    action={
                        <Button
                            variant="contained"
                            onClick={() => setMostrarEstadisticas(true)}
                        >
                            Ver Estadísticas
                        </Button>
                    }
                />
                <Box sx={{ mb: 4, mx: 2 }}>
                    <ExportarExcelResumen anio={anio} mes={mes} />
                </Box>
                <CardContent>
                    {loading && <Typography>Cargando...</Typography>}

                    {!loading && datosSupervisores.length === 0 && (
                        <Typography>No hay datos disponibles</Typography>
                    )}

                    {!loading && datosSupervisores.length > 0 && (
                        <>
                            <TableContainer component={Paper} sx={{ marginBottom: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Supervisor</TableCell>
                                            <TableCell>Salidas Autorizadas</TableCell>
                                            <TableCell>Duración Total (h)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {datosSupervisores.map((sup, index) => (
                                            <Row key={index} supervisor={sup} />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}

export default ResumenSupervisoresGlobal;
