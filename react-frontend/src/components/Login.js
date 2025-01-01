// import React, { useState } from "react";
// import axios from "axios";
// import { Box, TextField, Button, Typography } from "@mui/material";

// const Login = ({ onLogin }) => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleLogin = async () => {
//     try {
//       const response = await axios.post("http://127.0.0.1:5000/login", {
//         username,
//         password,
//       });
//       alert(response.data.message);
//       setUsername("");
//       setPassword("");
//       onLogin(response.data.username); // Notify parent about successful login
//     } catch (error) {
//       setError("Invalid credentials!");
//     }
//   };

//   return (
//     <Box
//       sx={{
//         maxWidth: 400,
//         margin: "50px auto",
//         padding: "20px",
//         border: "1px solid #ccc",
//         borderRadius: "8px",
//         boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
//       }}
//     >
//       <Typography variant="h5" textAlign="center" marginBottom={2}>
//         Login
//       </Typography>
//       {error && <Typography color="error">{error}</Typography>}
//       <TextField
//         fullWidth
//         margin="normal"
//         label="Username"
//         value={username}
//         onChange={(e) => setUsername(e.target.value)}
//       />
//       <TextField
//         fullWidth
//         margin="normal"
//         label="Password"
//         type="password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />
//       <Button
//         variant="contained"
//         fullWidth
//         sx={{ marginTop: 2 }}
//         onClick={handleLogin}
//       >
//         Login
//       </Button>
//     </Box>
//   );
// };

// export default Login;
