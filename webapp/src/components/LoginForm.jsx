import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Typography, Container, Box, Alert } from '@mui/material';
import config from './config';

const LoginForm = ({ onLogin }) => {
    const [legajo, setLegajo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${config.apiBaseUrl}/login`, {
                legajo,
                password
            });
            onLogin(response.data);
            console.log("onLogin: ",response.data)
        } catch (err) {
            console.log(err);
            setError('Error en el login');
        }
    };

    return (
        <Container maxWidth="xs">
            <Box my={4}>
                <Typography variant="h5" component="h1">
                    Iniciar Sesión
                </Typography>
                <form onSubmit={handleSubmit} noValidate>
                    <TextField
                        label="Legajo"
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="legajo"
                        name="legajo"
                        value={legajo}
                        onChange={(e) => setLegajo(e.target.value)}
                    />
                    <TextField
                        label="Contraseña"
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Iniciar sesión
                    </Button>
                    {error && <Alert severity="error">{error}</Alert>}
                </form>
            </Box>
        </Container>
    );
};

export default LoginForm;

