import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    TextField,
    Typography,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    FormControlLabel
} from "@mui/material";
import axios from "axios";
import config from './config';

const FormularioSalida = ({ supervisor }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [motivos, setMotivos] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [salidaSeleccionada, setSalidaSeleccionada] = useState({
        legajo: "",
        motivo: "",
        creador: supervisor,
        observaciones: ""
    });
    const [inputLegajo, setInputLegajo] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [filteredUsuarios, setFilteredUsuarios] = useState([]);
    const [sinRetorno, setSinRetorno] = useState(false);

    useEffect(() => {
        const fetchUsuariosYMotivos = async () => {
            try {
                const resUsuarios = await axios.get(
                    `${config.apiBaseUrl}/usuarios/empleado`
                );
                const resMotivos = await axios.get(`${config.apiBaseUrl}/motivos`);
                setUsuarios(resUsuarios.data);
                setMotivos(resMotivos.data);
            } catch (error) {
                console.error("Error al obtener datos:", error);
            }
        };

        fetchUsuariosYMotivos();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setSalidaSeleccionada((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSearchChange = (event) => {
        const inputValue = event.target.value.toLowerCase();
        setSearchInput(inputValue);

        const resultados = usuarios.filter(
            (u) =>
                u.nombre.toLowerCase().includes(inputValue) ||
                u.apellido.toLowerCase().includes(inputValue) ||
                u.legajo.toLowerCase().includes(inputValue)
        );
        setFilteredUsuarios(resultados);
    };

    const handleLegajoChange = (event) => {
        const legajo = event.target.value;
        setInputLegajo(legajo);

        const usuarioEncontrado = usuarios.find((u) => u.legajo === legajo);
        setUsuarioSeleccionado(usuarioEncontrado || null);

        setSalidaSeleccionada((prev) => ({
            ...prev,
            legajo: usuarioEncontrado ? usuarioEncontrado.legajo : "",
        }));
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
    };

    const handleSelectUsuario = (usuario) => {
        setUsuarioSeleccionado(usuario);
        setSalidaSeleccionada(prev => ({
            ...prev,
            legajo: usuario.legajo,
        }));
        setIsDialogOpen(false);
    };


    const handleSinRetornoChange = (event) => {
        setSinRetorno(event.target.checked);
    };

    useEffect(() => {
        console.log(sinRetorno);
    }, [sinRetorno]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!usuarioSeleccionado) {
            alert("Por favor, selecciona un usuario.");
            return;
        }

        const nuevaSalida = { ...salidaSeleccionada };
        if (sinRetorno) {
            nuevaSalida.observaciones = "sin retorno";
        }

        try {
            const response = await axios.post(`${config.apiBaseUrl}/salidas`, nuevaSalida);
            console.log("Salida creada:", response.data);
        } catch (error) {
            console.error("Error al crear salida:", error);
            alert("El usuario tiene una salida activa.");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Box display="flex" alignItems="center" gap={2} marginBottom={2}>
                <TextField
                    label="Buscar por legajo"
                    variant="outlined"
                    value={inputLegajo}
                    onChange={handleLegajoChange}
                    onKeyDown={handleKeyDown}
                    style={{ width: "200px" }}
                />
                {usuarioSeleccionado && (
                    <Box
                        bgcolor="#f0f0f0"
                        p={1}
                        borderRadius="borderRadius"
                    >
                        <Typography variant="body1">
                            {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
                        </Typography>
                    </Box>
                )}
            </Box>
            <Button variant="outlined" onClick={() => setIsDialogOpen(true)}>Buscar Empleado</Button>
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth>
                <DialogTitle>Buscar Empleado</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Buscar por Nombre, Apellido o Legajo"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={searchInput}
                        onChange={handleSearchChange}
                    />
                    <List>
                        {filteredUsuarios.map((usuario) => (
                            <ListItem button key={usuario.legajo} onClick={() => handleSelectUsuario(usuario)}>
                                <ListItemText primary={`${usuario.nombre} ${usuario.apellido} - ${usuario.legajo}`} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                </DialogActions>
            </Dialog>
            <FormControl fullWidth margin="normal">
                <InputLabel>Motivo</InputLabel>
                <Select
                    value={salidaSeleccionada.motivo}
                    label="Motivo"
                    name="motivo"
                    onChange={handleChange}
                >
                    {motivos
                        .filter((motivo) => motivo.id !== 7 && motivo.id !== 2)
                        .map((motivo) => (
                            <MenuItem key={motivo.id} value={motivo.id}>
                                {motivo.motivo_salida}
                            </MenuItem>
                        ))}
                </Select>
            </FormControl>

            <FormControlLabel
                control={<Checkbox checked={sinRetorno} onChange={handleSinRetornoChange} />}
                label="Sin retorno"
            />
            <Button type="submit" variant="contained" color="primary">
                Crear Salida
            </Button>
        </form>
    );
};

export default FormularioSalida;
