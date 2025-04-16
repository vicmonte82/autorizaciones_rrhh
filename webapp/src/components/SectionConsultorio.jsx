
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
    Typography
} from '@mui/material';

import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { decimalHoursToHMS } from './timeUtils';

function SectionConsultorio({ data }) {
    
    const consultorioData = data.map(d => {
        const consultorio = d.tipos_salidas?.find(ts =>
            ts.tipo?.toLowerCase().includes('consultorio')
        );
        return {
            sup_nombre: d.sup_nombre,
            sup_apellido: d.sup_apellido,
            salidas: consultorio?.count ? Math.abs(consultorio.count) : 0,
            horas: consultorio?.total_horas ? Math.abs(consultorio.total_horas) : 0,
        };
    });

    const consultorioFiltrado = consultorioData.filter(
        c => c.salidas > 0 || c.horas > 0
    );

    const sortedData = [...consultorioFiltrado].sort(
        (a, b) => b.salidas - a.salidas
    );

    const labels = sortedData.map(
        c => `${c.sup_nombre} ${c.sup_apellido}`
    );
    const salidas = sortedData.map(c => c.salidas);
    const horas = sortedData.map(c => c.horas);

    const barData = {
        labels,
        datasets: [
            {
                label: 'Salidas Consultorio',
                data: salidas,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                yAxisID: 'y'
            },
            {
                label: 'Horas (dec.)',
                data: horas,
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                yAxisID: 'y1'
            }
        ]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                ticks: {
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 0,
                    color: '#333',
                    font: { size: 12 }
                },
                grid: { display: false }
            },
            y: {
                beginAtZero: true,
                type: 'linear',
                position: 'left'
            },
            y1: {
                beginAtZero: true,
                type: 'linear',
                position: 'right',
                grid: { drawOnChartArea: false }
            }
        },
        plugins: {
            legend: {
                position: 'top'
            },
            datalabels: {
                anchor: 'end',
                align: 'end',
                clamp: true,
                color: '#000',
                font: { size: 11, weight: 'bold' },
                formatter: (value, context) => {
                    const datasetLabel = context.dataset.label;
                    if (datasetLabel.includes('Horas')) {
                        return decimalHoursToHMS(value);
                    }
                    return value;
                }
            }
        }
    };

    return (
        <Card sx={{ mb: 4 }}>
            <CardHeader
                title="Salidas de Consultorio"
                subheader="Ordenadas de mayor a menor según salidas"
            />
            <CardContent>
                {sortedData.length === 0 ? (
                    <Typography>No hay datos de consultorio</Typography>
                ) : (
                    <>
                        <Box sx={{ height: 400, mb: 2 }}>
                            <Bar data={barData} options={barOptions} />
                        </Box>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Supervisor</TableCell>
                                        <TableCell>Salidas</TableCell>
                                        <TableCell>Horas</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedData.map((c, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{`${c.sup_nombre} ${c.sup_apellido}`}</TableCell>
                                            <TableCell>{c.salidas}</TableCell>
                                            <TableCell>
                                                {decimalHoursToHMS(c.horas)}
                                            </TableCell>
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

export default SectionConsultorio;
