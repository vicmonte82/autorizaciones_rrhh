import React from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Button, Box } from '@mui/material';
import config from './config';

function ExportarExcelButton({ anio, mes }) {
    const exportarExcel = async () => {
        try {
            const urlSalidasOriginal = `${config.apiBaseUrl}/salidas/${anio}/${mes}`;

            const [salidasOriginalResponse] = await Promise.all([
                axios.get(urlSalidasOriginal),
            ]);

            const salidasOriginalData = salidasOriginalResponse.data;

            const workbook = XLSX.utils.book_new();

            const worksheetOriginal = XLSX.utils.json_to_sheet(
                salidasOriginalData.map(item => ({
                    'Legajo': item.legajo,
                    'Nombre Completo': item.nombre_completo,
                    'Fecha de Salida': new Date(item.created).toLocaleDateString('es-ES'),
                    'Hora de Salida': item.horario_salida,
                    'Hora de Regreso': item.horario_regreso,
                    'Duración Total': item.duracion,
                    'Estado': item.estado,
                    'Motivo': item.motivo,
                    'Observacion': item.observaciones,
                    'Supervisor': item.supervisor,
                    'Legajo Supervisor': item.legajosupervisor
                }))
            );
            XLSX.utils.book_append_sheet(workbook, worksheetOriginal, 'Salidas Original');

            XLSX.writeFile(workbook, `salidas_${anio}_${mes}.xlsx`);
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
        }
    };

    return (
        <Box>
            <Button
                variant="contained"
                sx={{ backgroundColor: '#28a745', color: 'white', '&:hover': { backgroundColor: '#218838' } }}
                onClick={exportarExcel}
            >
                Exportar a Excel
            </Button>
        </Box>
    );
}

export default ExportarExcelButton;
