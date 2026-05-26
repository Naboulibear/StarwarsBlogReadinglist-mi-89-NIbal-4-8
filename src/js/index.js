import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../styles/index.css";
import Home from "./component/home.jsx";
import { FavoritesProvider } from "./context/favoritesContext.jsx";

ReactDOM.createRoot(document.getElementById("app")).render(
<React.StrictMode>
<BrowserRouter>
<FavoritesProvider>
<Home />
</FavoritesProvider>
</BrowserRouter>
</React.StrictMode>
);
