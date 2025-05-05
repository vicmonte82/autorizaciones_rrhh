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
    ButtonGroup,
    TextField,
    Typography,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    FormControlLabel
} from "@mui/material";
import axios from "axios";
import config from "./config";


const RegistrarSalida = ({
    supervisor,
    onSalidaCreated = () => { },   // callback para nuevas salidas
    onIngresoCreated = () => { }   // callback para nuevas autorizaciones
}) => {
    // 1) Estados
    const [mode, setMode] = useState("salida");           // 'salida' o 'ingreso'
    const [usuarios, setUsuarios] = useState([]);
    const [motivosSalida, setMotivosSalida] = useState([]);
    const [motivosIngreso, setMotivosIngreso] = useState([]);

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

    // 2) Cargar usuarios y motivos de salida
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [resU, resMS, resMI] = await Promise.all([
                    axios.get(`${config.apiBaseUrl}/usuarios/empleado`),
                    axios.get(`${config.apiBaseUrl}/motivos`),
                    axios.get(`${config.apiBaseUrl}/autorizaciones/motivos`)
                ]);
                setUsuarios(resU.data);
                setMotivosSalida(resMS.data);
                setMotivosIngreso(resMI.data);
            } catch (err) {
                console.error("Error al cargar datos iniciales:", err);
            }
        };

        fetchInitialData();
    }, []);


    // 3) Handlers de búsqueda de usuario
    const handleSearchChange = e => {
        const q = e.target.value.toLowerCase();
        setSearchInput(q);
        setFilteredUsuarios(
            usuarios.filter(u =>
                u.nombre.toLowerCase().includes(q) ||
                u.apellido.toLowerCase().includes(q) ||
                u.legajo.toLowerCase().includes(q)
            )
        );
    };

    const handleLegajoChange = e => {
        const leg = e.target.value;
        setInputLegajo(leg);
        const user = usuarios.find(u => u.legajo === leg) || null;
        setUsuarioSeleccionado(user);
        setSalidaSeleccionada(prev => ({
            ...prev,
            legajo: user ? user.legajo : ""
        }));
    };

    const handleKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };

    const handleSelectUsuario = user => {
        setUsuarioSeleccionado(user);
        setSalidaSeleccionada(prev => ({ ...prev, legajo: user.legajo }));
        setIsDialogOpen(false);
    };

    // 4) Otros handlers de formulario
    const handleChange = e => {
        const { name, value } = e.target;
        setSalidaSeleccionada(prev => ({ ...prev, [name]: value }));
    };

    const handleSinRetornoChange = e => {
        setSinRetorno(e.target.checked);
    };

    // 5) Envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!usuarioSeleccionado) {
            return alert("Por favor, selecciona un usuario.");
        }

        try {
            if (mode === "salida") {
                // --- Payload para POST /salidas ---
                const payloadSalida = {
                    legajo: salidaSeleccionada.legajo,                            // req.body.legajo
                    motivo: salidaSeleccionada.motivo,                           // req.body.motivo
                    creador: supervisor,                                         // req.body.creador
                    observaciones: sinRetorno ? "sin retorno" : salidaSeleccionada.observaciones || ""
                };

                const { data: nuevaSalida } = await axios.post(
                    `${config.apiBaseUrl}/salidas`,
                    payloadSalida
                );
                // Llamo al callback de salidas
                onSalidaCreated?.(nuevaSalida);

            } else {
                // --- Payload para POST /autorizaciones (ingreso) ---
                const payloadIngreso = {
                    legajo_empleado: salidaSeleccionada.legajo,  // req.body.legajo_empleado
                    tipo: "INGRESO",                             // req.body.tipo
                    motivo: salidaSeleccionada.motivo,           // req.body.motivo
                    creador: supervisor                          // req.body.creador
                };

                const { data: nuevaAutorizacion } = await axios.post(
                    `${config.apiBaseUrl}/autorizaciones`,
                    payloadIngreso
                );
                // Llamo al callback de autorizaciones
                onIngresoCreated?.(nuevaAutorizacion);
            }

            // --- Después de crear, limpio el formulario ---
            setUsuarioSeleccionado(null);
            setInputLegajo("");
            setSalidaSeleccionada({
                legajo: "",
                motivo: "",
                creador: supervisor,
                observaciones: ""
            });
            setSinRetorno(false);

        } catch (err) {
            console.error("Error al crear:", err);
            if (mode === "salida") {
                alert(err.response?.data?.error || "No se pudo crear la salida.");
            } else {
                alert(err.response?.data?.error || "No se pudo crear la autorización de ingreso.");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Toggle Salida / Ingreso */}
            <ButtonGroup sx={{ mb: 2 }}>
                <Button
                    variant={mode === "salida" ? "contained" : "outlined"}
                    onClick={() => setMode("salida")}
                >
                    Salida
                </Button>
                <Button
                    variant={mode === "ingreso" ? "contained" : "outlined"}
                    onClick={() => setMode("ingreso")}
                >
                    Ingreso
                </Button>
            </ButtonGroup>

            {/* Búsqueda de usuario */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <TextField
                    label="Buscar por legajo"
                    variant="outlined"
                    value={inputLegajo}
                    onChange={handleLegajoChange}
                    onKeyDown={handleKeyDown}
                    sx={{ width: 200 }}
                />
                {usuarioSeleccionado && (
                    <Box bgcolor="#f0f0f0" p={1} borderRadius={1}>
                        <Typography>
                            {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
                        </Typography>
                    </Box>
                )}
            </Box>
            <Button variant="outlined" onClick={() => setIsDialogOpen(true)}>
                Buscar Empleado
            </Button>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth>
                <DialogTitle>Buscar Empleado</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nombre, Apellido o Legajo"
                        fullWidth
                        variant="outlined"
                        value={searchInput}
                        onChange={handleSearchChange}
                    />
                    <List>
                        {filteredUsuarios.map(u => (
                            <ListItem button key={u.legajo} onClick={() => handleSelectUsuario(u)}>
                                <ListItemText primary={`${u.nombre} ${u.apellido} - ${u.legajo}`} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                </DialogActions>
            </Dialog>

            {/* Selector de motivo */}
            <FormControl fullWidth margin="normal">
                <InputLabel>
                    {mode === "salida" ? "Motivo de Salida" : "Motivo de Ingreso"}
                </InputLabel>
                <Select
                    name="motivo"
                    value={salidaSeleccionada.motivo}
                    label={mode === "salida" ? "Motivo de Salida" : "Motivo de Ingreso"}
                    onChange={handleChange}
                >
                    {(mode === "salida" ? motivosSalida : motivosIngreso).map(m => (
                        <MenuItem key={m.id} value={m.id}>
                            {mode === "salida" ? m.motivo_salida : m.motivo_ingreso}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Checkbox sólo en Salida */}
            {mode === "salida" && (
                <FormControlLabel
                    control={<Checkbox checked={sinRetorno} onChange={handleSinRetornoChange} />}
                    label="Sin retorno"
                />
            )}

            <Box mt={2}>
                <Button type="submit" variant="contained" color="primary">
                    {mode === "salida" ? "Crear Salida" : "Crear Autorización"}
                </Button>
            </Box>
        </form>
    );
};

export default RegistrarSalida;
