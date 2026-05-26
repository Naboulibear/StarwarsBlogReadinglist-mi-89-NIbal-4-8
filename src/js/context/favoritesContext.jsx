import React, { createContext, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
const [favorites, setFavorites] = useState([]);

const isFavorite = (type, id) =>
favorites.some((item) => item.type === type && item.id === String(id));

const toggleFavorite = (favoriteItem) => {
setFavorites((current) => {
const exists = current.some(
(item) => item.type === favoriteItem.type && item.id === String(favoriteItem.id)
);

if (exists) {
return current.filter(
(item) => !(item.type === favoriteItem.type && item.id === String(favoriteItem.id))
);
}

return [
...current,
{
id: String(favoriteItem.id),
type: favoriteItem.type,
name: favoriteItem.name
}
];
});
};

const removeFavorite = (type, id) => {
setFavorites((current) =>
current.filter((item) => !(item.type === type && item.id === String(id)))
);
};

const value = useMemo(
() => ({
favorites,
toggleFavorite,
removeFavorite,
isFavorite
}),
[favorites]
);

return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

FavoritesProvider.propTypes = {
children: PropTypes.node.isRequired
};

export const useFavorites = () => {
const context = useContext(FavoritesContext);

if (!context) {
throw new Error("useFavorites must be used within FavoritesProvider");
}

return context;
};
