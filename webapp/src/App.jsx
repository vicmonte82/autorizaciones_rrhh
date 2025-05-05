import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  ButtonGroup,
  Button
} from '@mui/material';
import ListaSalidasSupervisor from './components/ListaSalidasSupervisor';
import ListaAutorizacionesSupervisor from './components/ListaAutorizacionesSupervisor';
import ListaSalidasVigilancia from './components/ListaSalidasVigilancia';
import ListaSalidasEnfermeria from './components/ListaSalidasEnfermeria';
import Reportes from './components/Reportes';
import FormularioSalida from './components/RegistrarSalida';
import LoginForm from './components/LoginForm';
import image1 from './assets/logonuevo.png';

const App = () => {
  const [user, setUser] = useState(null);
  const [listMode, setListMode] = useState('salida'); // 'salida' o 'ingreso'

  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Vista completa de Supervisor: formulario + toggle + listados
  const renderSupervisorView = () => (
    <Grid container spacing={3}>
      {/* Panel de creación */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Crear Autorización
          </Typography>
          <FormularioSalida
            supervisor={user.legajo}
            onSalidaCreated={(nueva) => console.log('Nueva Salida:', nueva)}
            onIngresoCreated={(nueva) =>
              console.log('Nueva Autorización:', nueva)
            }
          />
        </Paper>
      </Grid>

      {/* Panel de listados */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Box
            mb={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {listMode === 'salida'
                ? 'Salidas Creadas'
                : 'Autorizaciones de Ingreso'}
            </Typography>
            <ButtonGroup size="small">
              <Button
                variant={listMode === 'salida' ? 'contained' : 'outlined'}
                onClick={() => setListMode('salida')}
              >
                Ver Salidas
              </Button>
              <Button
                variant={listMode === 'ingreso' ? 'contained' : 'outlined'}
                onClick={() => setListMode('ingreso')}
              >
                Ver Ingresos
              </Button>
            </ButtonGroup>
          </Box>

          {listMode === 'salida' ? (
            <ListaSalidasSupervisor rol={user.rol} legajo={user.legajo} />
          ) : (
            <ListaAutorizacionesSupervisor legajo={user.legajo} />
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  // El renderizado principal, según rol
  return (
    <Container
      maxWidth="lg"
      disableGutters
      sx={{ width: '95%', margin: '0 auto', py: 4 }}
    >
      {/* Header */}
      {user && (
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              mb: 2
            }}
          >
            <img
              src={image1}
              alt="Marfrig"
              style={{ height: 60, width: 'auto' }}
            />
            <Typography variant="h4">
              Control de salidas eventuales – San Jorge
            </Typography>
          </Box>
          <Typography variant="h5" gutterBottom>
            {user.nombre} {user.apellido}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Hoy es {new Date().toLocaleDateString('es-ES')}
          </Typography>
        </Box>
      )}

      {/* Si no hay usuario, muestro login; si hay, el panel según rol */}
      {user ? (
        <>
          {user.rol === 'Supervisor' && renderSupervisorView()}
          {user.rol === 'Vigilancia' && (
            <ListaSalidasVigilancia rol={user.rol} legajo={user.legajo} />
          )}
          {user.rol === 'Enfermería' && (
            <ListaSalidasEnfermeria rol={user.rol} legajo={user.legajo} />
          )}
          {user.rol === 'RRHH' && <Reportes />}
        </>
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </Container>
  );
};

export default App;
