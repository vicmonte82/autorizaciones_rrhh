import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { List, ListItem, ListItemText, Button } from '@mui/material';
import config from './config';

function MarcarSalida() {
    const [salidas, setSalidas] = useState([]);

    useEffect(() => {
        const obtenerSalidas = async () => {
            const response = await axios.get(`${config.apiBaseUrl}/salidas/sinEjecutar`);
            setSalidas(response.data);
        };

        obtenerSalidas();
    }, [salidas]);

    const marcarSalida = async (id) => {
        await axios.put(`${config.apiBaseUrl}/salidas/egreso/${id}`);
    };

    return (
        <List>
            {salidas.map((salida) => (
                <ListItem key={salida.id}>
                    <ListItemText primary={`Legajo: ${salida.legajo}`} />
                    <Button onClick={() => marcarSalida(salida.id)} color="primary">
                        Marcar Salida
                    </Button>
                </ListItem>
            ))}
        </List>
    );
}

export default MarcarSalida;
