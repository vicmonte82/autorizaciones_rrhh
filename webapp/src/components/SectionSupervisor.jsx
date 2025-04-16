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

    function SectionSupervisor({ data }) {
        const sortedData = [...data].sort((a, b) => (b.total_salidas || 0) - (a.total_salidas || 0));

        const labels = sortedData.map(d => `${d.sup_nombre} ${d.sup_apellido}`);
        const salidas = sortedData.map(d => d.total_salidas || 0);
        const horas = sortedData.map(d => Math.abs(d.total_horas) || 0);

        const barData = {
            labels,
            datasets: [
                {
                    label: 'Salidas',
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
                    grid: { drawOnChartArea: false },
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
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
                    title="Salidas por Supervisor"
                    subheader="Ordenado de mayor a menor en salidas"
                />
                <CardContent>
                    {sortedData.length === 0 ? (
                        <Typography>No hay datos de supervisores</Typography>
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
                                        {sortedData.map((d, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{`${d.sup_nombre} ${d.sup_apellido}`}</TableCell>
                                                <TableCell>{d.total_salidas}</TableCell>
                                                <TableCell>{decimalHoursToHMS(Math.abs(d.total_horas || 0))}</TableCell>
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

    export default SectionSupervisor;
