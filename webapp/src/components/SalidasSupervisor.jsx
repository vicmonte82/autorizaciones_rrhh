import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Card,
    CardContent,
    CardHeader,
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import config from './config';



function SupervisorList({ anio, mes }) {
    const [supervisores, setSupervisores] = useState([]);
    const [salidasPorSupervisor, setSalidasPorSupervisor] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`${config.apiBaseUrl}/salidas/supervisor/${anio}/${mes}`)
            .then(response => {
                setSupervisores(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });
    }, [anio, mes]);

    const obtenerDetallesSalidas = async (supervisorId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${config.apiBaseUrl}/salidasPorSupervisor/${supervisorId}/${anio}/${mes}`);
            setSalidasPorSupervisor(response.data);
            console.log(response.data)
            setLoading(false);
        } catch (error) {
            console.error('Error fetching supervisor details:', error);
            setLoading(false);
            setSalidasPorSupervisor([]);
        }
    };

    const handleAccordionChange = (supervisorId) => {
        if (expanded === supervisorId) {
            setExpanded(null);
        } else {
            setExpanded(supervisorId);
            obtenerDetallesSalidas(supervisorId);
        }
    };

    const calcularDuracion = (estado, timestampSalida, timestampRegreso) => {
        switch (estado) {
            case 'Finalizado':
                if (!timestampSalida || !timestampRegreso || timestampSalida === 0 || timestampRegreso === 0) {
                    return 0;
                }
                const salida = new Date(timestampSalida);
                const regreso = new Date(timestampRegreso);

                const diferencia = regreso.getTime() - salida.getTime();
                console.log(Math.floor(diferencia / 1000))

                return Math.floor(diferencia / 1000);
                
            case 'Activo':
                return "Activo";

            case 'Pendiente':
                return "Pendiente";

            default:
                return "Estado desconocido";
        }
    };

    const formatDuracion = (duracionSegundos) => {
        if (duracionSegundos === "salida abierta") {
            return "salida abierta";
        }
        const horas = Math.floor(duracionSegundos / 3600);
        const minutos = Math.floor((duracionSegundos % 3600) / 60);
        const segundos = duracionSegundos % 60;
        return `${horas}h ${minutos}m ${segundos}s`;
    };

    return (
        <Card raised sx={{
            width: '100%',
            margin: '0 auto',
            mb: 4
        }}>
            <CardHeader title="Listado de Supervisores" subheader="Visualiza las salidas supervisadas y sus totales." />
            <CardContent>
                {loading && <CircularProgress size="small" />}
                {!loading && Array.isArray(supervisores) && supervisores.map(sup => (
                    <Accordion
                        key={sup.supervisor}
                        expanded={expanded === sup.supervisor}
                        onChange={() => handleAccordionChange(sup.supervisor)}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                        >
                            <Typography>{sup.nombre} - Total Salidas: {sup.totalSalidas}, Total Horas: {sup.totalHoras}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Empleado</TableCell>
                                            <TableCell>Fecha</TableCell>
                                            <TableCell>Duración</TableCell>
                                            <TableCell>Motivo</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {salidasPorSupervisor.map((salida) => (
                                            <TableRow key={salida.id}>
                                                <TableCell>{salida.nombre_completo}</TableCell>
                                                <TableCell>{new Date(salida.timestamp_salida).toLocaleDateString('ES-es')}</TableCell>
                                                {salida.estado !== 'Finalizado' && <TableCell>{salida.estado}</TableCell>}
                                                {salida.estado === 'Finalizado' && <TableCell>{formatDuracion(calcularDuracion(salida.estado, salida.timestamp_salida, salida.timestamp_regreso))}</TableCell>}
                                                <TableCell>{salida.motivo}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </CardContent>
        </Card>
    );
}

export default SupervisorList;
