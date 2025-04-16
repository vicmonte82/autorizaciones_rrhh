

import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import SectionSupervisor from './SectionSupervisor';
import SectionConsultorio from './SectionConsultorio';
import SectionTipo from './SectionTipo';


function EstadisticasPanel({ datos }) {
    const [modo, setModo] = useState('supervisor');

    const handleModo = (nuevoModo) => {
        setModo(nuevoModo);
    };

    let contenido;
    switch (modo) {
        case 'supervisor':
            contenido = <SectionSupervisor data={datos} />;
            break;
        case 'consultorio':
            contenido = <SectionConsultorio data={datos} />;
            break;
        case 'tipo':
            contenido = <SectionTipo data={datos} />;
            break;
        default:
            contenido = <SectionSupervisor data={datos} />;
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" gutterBottom>
                Panel de Estadísticas
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                    variant={modo === 'supervisor' ? 'contained' : 'outlined'}
                    onClick={() => handleModo('supervisor')}
                >
                    Supervisor
                </Button>
                <Button
                    variant={modo === 'consultorio' ? 'contained' : 'outlined'}
                    onClick={() => handleModo('consultorio')}
                >
                    Consultorio
                </Button>
                <Button
                    variant={modo === 'tipo' ? 'contained' : 'outlined'}
                    onClick={() => handleModo('tipo')}
                >
                    Tipo de Salida
                </Button>
            </Box>

            {contenido}
        </Box>
    );
}

export default EstadisticasPanel;
