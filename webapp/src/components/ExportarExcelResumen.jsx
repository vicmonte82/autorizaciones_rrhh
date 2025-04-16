import React from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Button, Box } from '@mui/material';
import config from './config';


function ExportarExcelResumen({ anio, mes }) {
    const exportarExcel = async () => {
        try {
            const url = `${config.apiBaseUrl}/datosSalidas?mes=${mes}&anio=${anio}`;
            const response = await axios.get(url);
            const data = response.data;
            const filas = [];
            data.forEach((sup) => {
                const totalSalidas = parseInt(sup.total_salidas, 10) || 0;
                const totalHoras = parseFloat(sup.total_horas).toFixed(4);

                filas.push({
                    'Supervisor': `${sup.sup_nombre} ${sup.sup_apellido}`,
                    'Total Salidas': totalSalidas,
                    'Total Horas': totalHoras
                });

                
                if (Array.isArray(sup.tipos_salidas) && sup.tipos_salidas.length > 0) {
                    sup.tipos_salidas.forEach((ts) => {
                        const countTipo = parseInt(ts.count, 10) || 0;
                        const horasTipo = parseFloat(ts.total_horas).toFixed(4);

                        filas.push({
                            'Supervisor': `   ↳ ${sup.sup_nombre} ${sup.sup_apellido}`,
                            'Tipo': ts.tipo,
                            'Salidas (tipo)': countTipo,
                            'Horas (tipo)': horasTipo
                        });
                    });
                }

                filas.push({});
            });

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(filas);

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen Supervisores');

            XLSX.writeFile(workbook, `resumen_supervisores_${anio}_${mes}.xlsx`);
        } catch (error) {
            console.error('Error al exportar a Excel (Resumen Supervisores):', error);
        }
    };

    return (
        <Box>
            <Button
                variant="contained"
                sx={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    '&:hover': { backgroundColor: '#218838' }
                }}
                onClick={exportarExcel}
            >
                Exportar Resumen a Excel
            </Button>
        </Box>
    );
}

export default ExportarExcelResumen;
