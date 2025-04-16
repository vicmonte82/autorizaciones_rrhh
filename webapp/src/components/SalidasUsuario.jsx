import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import config from './config';


function UserSalidas({ legajo, anio, mes }) {
    const [salidas, setSalidas] = useState([]);
    const [totalHoras, setTotalHoras] = useState('0h 0m 0s');

    useEffect(() => {
        if (legajo) {
            axios.get(`${config.apiBaseUrl}/salidas/usuario/${legajo}/${anio}/${mes}`)
                .then(response => {
                    setSalidas(response.data);
                    let totalHoras = 0;
                    let totalMinutos = 0;
                    let totalSegundos = 0;

                    response.data.forEach(salida => {
                        const duracionArray = salida.duracionHoras.split(' ');
                        const horas = parseInt(duracionArray[0].replace('h', ''), 10);
                        const minutos = parseInt(duracionArray[1].replace('m', ''), 10);
                        const segundos = parseInt(duracionArray[2].replace('s', ''), 10);

                        totalHoras += horas;
                        totalMinutos += minutos;
                        totalSegundos += segundos;
                    });

                    totalMinutos += Math.floor(totalSegundos / 60);
                    totalSegundos %= 60;
                    totalHoras += Math.floor(totalMinutos / 60);
                    totalMinutos %= 60;

                    setTotalHoras(`${totalHoras}h ${totalMinutos}m ${totalSegundos}s`);
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    setTotalHoras('0h 0m 0s');
                });
        }
    }, [legajo, anio, mes]);


    return (
        <Card raised sx={{
            width: '100%',
            margin: '0 auto',
            mb: 4
        }}>
            <CardHeader title={`Salidas Legajo ${legajo}`} subheader={`Detalles de salidas para el legajo seleccionado en el periodo ${mes}/${anio}. Total Horas: ${totalHoras}`} />
            <CardContent>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        <Typography>Total Salidas: {salidas.length}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nombre y Apellido</TableCell>
                                        <TableCell>Horario de Salida</TableCell>
                                        <TableCell>Horario de Regreso</TableCell>
                                        <TableCell>Duración</TableCell>
                                        <TableCell>Motivo</TableCell>
                                        <TableCell>Estado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {salidas.map((salida) => (
                                        <TableRow key={salida.id}>
                                            <TableCell>{salida.nombre} {salida.apellido}</TableCell>
                                            <TableCell>{salida.horarioSalida}</TableCell>
                                            <TableCell>{salida.horarioRegreso}</TableCell>
                                            <TableCell>{salida.duracionHoras}</TableCell>
                                            <TableCell>{salida.motivoSalida}</TableCell>
                                            <TableCell>{salida.estado}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </AccordionDetails>
                </Accordion>
            </CardContent>
        </Card>
    );
}

export default UserSalidas;
