import React, { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import ListaSalidasSupervisor from './components/ListaSalidasSupervisor';
import ListaSalidasVigilancia from './components/ListaSalidasVigilancia';
import ListaSalidasEnfermeria from './components/ListaSalidasEnfermeria';
import Reportes from './components/Reportes'
import FormularioSalida from './components/RegistrarSalida';
import LoginForm from './components/LoginForm';
import image1 from "./assets/logonuevo.png";

const App = () => {
  const [user, setUser] = useState(null);
  const handleLogin = (userData) => {
    setUser(userData);
  };

  const renderComponentsBasedOnRole = () => {
    switch (user.rol) {
      case 'Vigilancia':
        return <ListaSalidasVigilancia rol={user.rol} legajo={user.legajo} />;
      case 'Enfermería':
        return <ListaSalidasEnfermeria rol={user.rol} legajo={user.legajo} />;
      case 'Supervisor':
        return (
          <>
            <FormularioSalida supervisor={user.legajo} />
            <ListaSalidasSupervisor rol={user.rol} legajo={user.legajo} />
          </>
        );
      case 'RRHH':
       return  <Reportes />;
      default:
        return null;
    }
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        width: '95%',   
        margin: '0 auto',
      }}
    >
      <Box sx={{
        width: '100%',
        margin: '0 auto',
      }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 2
          }}
        >
          <img
            src={image1}
            alt="Marfrig"
            style={{
              width: 'auto',
              height: '100%',
            }}
          />
          <Typography variant="h4">Control de salidas eventuales - San Jorge</Typography>
        </Box>
        {user ? (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              {user.nombre} {user.apellido}
            </Typography>
            <Typography component="h3" gutterBottom>
              Hoy es {new Date().toLocaleDateString('es-ES')}
            </Typography>
            {renderComponentsBasedOnRole()}
          </>
        ) : (
          <>
            <LoginForm onLogin={handleLogin} />
          </>
        )}
      </Box>
    </Container>
  );
};

export default App;



