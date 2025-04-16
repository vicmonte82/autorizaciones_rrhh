import React from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Box,
    Typography,
    Grid
} from '@mui/material';

import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { decimalHoursToHMS } from './timeUtils';

function SectionTipo({ data }) {
    const acumulado = {};

    data.forEach(d => {
        d.tipos_salidas?.forEach(ts => {
            const key = ts.tipo;
            if (!acumulado[key]) {
                acumulado[key] = { countTotal: 0, horasTotal: 0 };
            }
            acumulado[key].countTotal += Math.abs(ts.count);
            acumulado[key].horasTotal += Math.abs(ts.total_horas);
        });
    });

    const tipoArray = Object.keys(acumulado).map(k => ({
        tipo: k,
        count: acumulado[k].countTotal,
        horas: acumulado[k].horasTotal
    }));

    tipoArray.sort((a, b) => b.count - a.count);

    const labels = tipoArray.map(t => t.tipo);
    const counts = tipoArray.map(t => t.count);
    const horas = tipoArray.map(t => t.horas);

    const pieDataCount = {
        labels,
        datasets: [
            {
                label: 'Salidas Totales (por tipo)',
                data: counts,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 11, 0.7)',
                ]
            }
        ]
    };

    const pieDataHoras = {
        labels,
        datasets: [
            {
                label: 'Horas Totales (por tipo)',
                data: horas,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 11, 0.7)',
                ]
            }
        ]
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            },
            datalabels: {
                color: '#fff',
                font: { size: 12, weight: 'bold' },
                anchor: 'center',
                align: 'center',
                formatter: (value, context) => {
                    const idx = context.dataIndex;
                    const label = context.chart.data.labels[idx];
                    return `${label}: ${value}`;
                }
            }
        }
    };

    return (
        <Card sx={{ mb: 4 }}>
            <CardHeader
                title="Salidas por Tipo (Global)"
                subheader="Ordenado por mayor cantidad de salidas"
            />
            <CardContent>
                {tipoArray.length === 0 ? (
                    <Typography>No hay tipos de salida</Typography>
                ) : (
                    <>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ height: 400, mb: 2 }}>
                                    <Pie data={pieDataCount} options={pieOptions} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ height: 400, mb: 2 }}>
                                    <Pie data={pieDataHoras} options={pieOptions} />
                                </Box>
                            </Grid>
                        </Grid>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Tipo de Salida</TableCell>
                                        <TableCell>Salidas Totales</TableCell>
                                        <TableCell>Horas Totales</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tipoArray.map((t, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{t.tipo}</TableCell>
                                            <TableCell>{t.count}</TableCell>
                                            <TableCell>{decimalHoursToHMS(t.horas)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default SectionTipo;