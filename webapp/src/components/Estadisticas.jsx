import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import EstadisticasPanel from './EstadisiticasPanel';
import config from './config';

function PanelEstadisticas({ anio, mes, onClose }) {
    const [datos, setDatos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios
            .get(`${config.apiBaseUrl}/datosSalidas?anio=${anio}&mes=${mes}`)
            .then((response) => {
                setDatos(response.data);
            })
            .catch((error) => {
                console.error('Error obteniendo /datosSalidas:', error);
            })
            .finally(() => setLoading(false));
    }, [anio, mes]);

    if (loading) {
        return <Typography>Cargando datos...</Typography>;
    }

    return (
        <Box sx={{ width: '100%', margin: '0 auto' }}>
            {onClose && (
                <Button variant="contained" sx={{ mb: 2 }} onClick={onClose}>
                    Volver
                </Button>
            )}
            {datos.length === 0 ? (
                <Typography>No hay datos para este período.</Typography>
            ) : (
                <EstadisticasPanel datos={datos} />
            )}
        </Box>
    );
}

export default PanelEstadisticas;
