import React, { useState } from 'react';
import { Container, Typography, TextField, Box, Button } from '@mui/material';
import SalidasUsuario from './SalidasUsuario';
import ExportarExcelButton from './BotonExportarAExcel';
import ResumenSupervisoresGlobal from './ResumenSupervisoresGlobal';
import ListaAutorizacionesRRHH from './ListaAutorizacionesRRHH'; // ← nuevo

function Reportes() {
    const [legajo, setLegajo] = useState('');
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [viewMode, setViewMode] = useState('supervisor'); // 'supervisor'|'empleado'|'ingresos'

    const handleChangeMes = (e) => {
        let valor = parseInt(e.target.value, 10) || 1;
        if (valor < 1) valor = 1;
        if (valor > 12) valor = 12;
        setMes(valor);
    };

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
                Control de Salidas Eventuales – RRHH
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 2,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                }}
            >
                {/* Modo de vista */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Button
                        variant={viewMode === 'supervisor' ? 'contained' : 'outlined'}
                        onClick={() => setViewMode('supervisor')}
                    >
                        Salidas por Supervisor
                    </Button>
                    <Button
                        variant={viewMode === 'empleado' ? 'contained' : 'outlined'}
                        onClick={() => setViewMode('empleado')}
                    >
                        Salidas por Empleado
                    </Button>
                    <Button
                        variant={viewMode === 'ingresos' ? 'contained' : 'outlined'}
                        onClick={() => setViewMode('ingresos')}
                    >
                        Autorizaciones Ingreso
                    </Button>

                    <ExportarExcelButton anio={anio} mes={mes} />
                </Box>

                {/* Filtros: legajo solo si empleado */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {viewMode === 'empleado' && (
                        <TextField
                            label="Legajo"
                            variant="outlined"
                            type="number"
                            value={legajo}
                            onChange={(e) => setLegajo(e.target.value)}
                            sx={{ maxWidth: 150 }}
                        />
                    )}
                    <TextField
                        label="Año"
                        variant="outlined"
                        type="number"
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                        sx={{ maxWidth: 150 }}
                    />
                    <TextField
                        label="Mes"
                        variant="outlined"
                        type="number"
                        value={mes}
                        onChange={handleChangeMes}
                        sx={{ maxWidth: 150 }}
                        inputProps={{ min: 1, max: 12 }}
                    />
                </Box>
            </Box>

            {/* Renderizado según modo */}
            {viewMode === 'supervisor' && (
                <ResumenSupervisoresGlobal anio={anio} mes={mes} />
            )}
            {viewMode === 'empleado' && (
                <SalidasUsuario legajo={legajo} anio={anio} mes={mes} />
            )}
            {viewMode === 'ingresos' && (
                <ListaAutorizacionesRRHH anio={anio} mes={mes} />
            )}
        </Container>
    );
}

export default Reportes;
