import React, { useState } from 'react';
import { Container, Typography, TextField, Box, Button } from '@mui/material';
import SalidasUsuario from './SalidasUsuario';
import ExportarExcelButton from './BotonExportarAExcel';
import ResumenSupervisoresGlobal from './ResumenSupervisoresGlobal';

function Reportes() {
    const [legajo, setLegajo] = useState('');
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [mostrarSalidasPorSupervisor, setMostrarSalidasPorSupervisor] = useState(true);

    const handleMostrarSalidasPorSupervisor = () => {
        setMostrarSalidasPorSupervisor(true);
    };

    const handleMostrarSalidasPorEmpleado = () => {
        setMostrarSalidasPorSupervisor(false);
    };

    const handleChangeMes = (e) => {
        let valor = parseInt(e.target.value, 10) || 1;
        if (valor < 1) valor = 1;
        if (valor > 12) valor = 12;
        setMes(valor);
    };

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom component="div">
                Control de Salidas Eventuales - RRHH
            </Typography>
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                marginBottom: 2,
                alignItems: 'center', 
                justifyContent: 'flex-start',
            }}>                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 2 }}>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 2 }}>
                        <Button variant="contained" onClick={handleMostrarSalidasPorSupervisor}>Salidas por Supervisor</Button>
                        <Button variant="contained" onClick={handleMostrarSalidasPorEmpleado}>Salidas por Empleado</Button>
                        <ExportarExcelButton anio={anio} mes={mes} />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 2 }}>
                    {!mostrarSalidasPorSupervisor &&
                        <TextField
                            label="Legajo"
                            variant="outlined"
                            type="number"
                            value={legajo}
                            onChange={(e) => setLegajo(e.target.value)}
                            sx={{ maxWidth: 150 }}
                        />}
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
                    {mostrarSalidasPorSupervisor ? 
                        <>
                        <ResumenSupervisoresGlobal anio={anio} mes={mes} /> 
                        </> : <SalidasUsuario legajo={legajo} anio={anio} mes={mes} />}
                    </Box>
                </Box>
            </Box>
        </Container>
    );


}

export default Reportes;
