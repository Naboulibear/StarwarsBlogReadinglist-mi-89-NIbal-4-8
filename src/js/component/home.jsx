import React, { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { useFavorites } from "../context/favoritesContext.jsx";

const SWAPI_BASE_URL = "https://www.swapi.tech/api";
const IMAGE_BASE_URL =
"https://github.com/breatheco-de/swapi-images/blob/master/public/images";

const ENTITY_CONFIG = {
people: {
title: "Characters",
imageFolder: "characters",
summaryFields: ["gender", "hair_color", "eye_color"]
},
vehicles: {
title: "Vehicles",
imageFolder: "vehicles",
summaryFields: ["model", "vehicle_class", "manufacturer"]
},
planets: {
title: "Planets",
imageFolder: "planets",
summaryFields: ["population", "terrain", "climate"]
}
};

const FALLBACK_DATA = {
	people: [
		{ id: "1", name: "Luke Skywalker", gender: "male", hair_color: "blond", eye_color: "blue" },
		{ id: "2", name: "C-3PO", gender: "n/a", hair_color: "n/a", eye_color: "yellow" },
		{ id: "3", name: "R2-D2", gender: "n/a", hair_color: "n/a", eye_color: "red" }
	],
	vehicles: [
		{
			id: "4",
			name: "Sand Crawler",
			model: "Digger Crawler",
			vehicle_class: "wheeled",
			manufacturer: "Corellia Mining Corporation"
		},
		{
			id: "6",
			name: "T-16 skyhopper",
			model: "T-16 skyhopper",
			vehicle_class: "repulsorcraft",
			manufacturer: "Incom Corporation"
		},
		{
			id: "7",
			name: "X-34 landspeeder",
			model: "X-34 landspeeder",
			vehicle_class: "repulsorcraft",
			manufacturer: "SoroSuub Corporation"
		}
	],
	planets: [
		{ id: "1", name: "Tatooine", population: "200000", terrain: "desert", climate: "arid" },
		{ id: "2", name: "Alderaan", population: "2000000000", terrain: "grasslands, mountains", climate: "temperate" },
		{ id: "3", name: "Yavin IV", population: "1000", terrain: "jungle, rainforests", climate: "temperate, tropical" }
	]
};

const TYPE_ALIASES = {
character: "people",
characters: "people",
people: "people",
planet: "planets",
planets: "planets",
vehicle: "vehicles",
vehicles: "vehicles"
};

const getApiType = (typeParam) => TYPE_ALIASES[typeParam] || null;

const getImageUrl = (type, id) => {
const config = ENTITY_CONFIG[type];
if (!config) return "";
return `${IMAGE_BASE_URL}/${config.imageFolder}/${id}.jpg?raw=true`;
};

const formatLabel = (key) =>
key
.split("_")
.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
.join(" ");

const safeDisplayValue = (value) => (value && value !== "n/a" ? value : "Unknown");
const getFallbackCollection = (type) => FALLBACK_DATA[type] || [];
const getFallbackEntity = (type, id) =>
getFallbackCollection(type).find((item) => item.id === String(id));

const fetchEntityDetail = async (type, id) => {
try {
const response = await fetch(`${SWAPI_BASE_URL}/${type}/${id}`);
if (!response.ok) {
throw new Error(`Unable to fetch ${type} details`);
}
const payload = await response.json();
const properties = payload?.result?.properties || {};
return {
id: String(id),
name: payload?.result?.properties?.name || payload?.result?.uid || "Unknown",
...properties
};
} catch (error) {
const fallbackEntity = getFallbackEntity(type, id);
if (fallbackEntity) {
return fallbackEntity;
}
throw error;
}
};

const fetchEntityCollection = async (type) => {
try {
const response = await fetch(`${SWAPI_BASE_URL}/${type}?page=1&limit=8`);
if (!response.ok) {
throw new Error(`Unable to fetch ${type}`);
}

const payload = await response.json();
const records = payload?.results || [];

const details = await Promise.all(
records.map(async (record) => {
try {
return await fetchEntityDetail(type, record.uid);
} catch (error) {
return {
	id: String(record.uid),
	name: record.name
};
}
})
);

return details;
} catch (error) {
return getFallbackCollection(type);
}
};

const FavoritesDropdown = () => {
const { favorites, removeFavorite } = useFavorites();

return (
<div className="dropdown">
<button
className="btn btn-warning dropdown-toggle"
type="button"
data-bs-toggle="dropdown"
aria-expanded="false">
Favorites <span className="badge text-bg-dark ms-1">{favorites.length}</span>
</button>
<ul className="dropdown-menu dropdown-menu-end">
{favorites.length === 0 ? (
<li className="dropdown-item text-muted">No favorites yet</li>
) : (
favorites.map((favorite) => (
<li
className="dropdown-item d-flex justify-content-between align-items-center gap-2"
key={`${favorite.type}-${favorite.id}`}>
<Link
className="text-decoration-none text-dark flex-grow-1"
to={`/details/${favorite.type}/${favorite.id}`}>
{favorite.name}
</Link>
<button
type="button"
className="btn btn-sm btn-link text-danger p-0"
onClick={() => removeFavorite(favorite.type, favorite.id)}
aria-label={`Remove ${favorite.name} from favorites`}>
<span aria-hidden="true">🗑</span>
</button>
</li>
))
)}
</ul>
</div>
);
};

const Navbar = () => (
<nav className="navbar navbar-expand-lg bg-dark navbar-dark sticky-top">
<div className="container">
<Link className="navbar-brand d-flex align-items-center gap-2" to="/">
<img
src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Star_Wars_Logo.svg"
alt="Star Wars"
height="30"
/>
<span>Blog Reading List</span>
</Link>
<FavoritesDropdown />
</div>
</nav>
);

const FavoriteButton = ({ item }) => {
const { isFavorite, toggleFavorite } = useFavorites();
const favorite = isFavorite(item.type, item.id);

return (
<button
type="button"
className={`btn btn-outline-warning ${favorite ? "favorite-active" : ""}`}
onClick={() => toggleFavorite(item)}
aria-label={favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}>
<span aria-hidden="true" className="fs-5 lh-1">
	{favorite ? "♥" : "♡"}
</span>
</button>
);
};

FavoriteButton.propTypes = {
item: PropTypes.shape({
id: PropTypes.string.isRequired,
name: PropTypes.string.isRequired,
type: PropTypes.string.isRequired
}).isRequired
};

const EntityCard = ({ type, entity }) => {
const config = ENTITY_CONFIG[type];
return (
<div className="col">
<div className="card h-100 shadow-sm">
<img
src={getImageUrl(type, entity.id)}
className="card-img-top entity-image"
alt={entity.name}
onError={(event) => {
event.currentTarget.src =
"https://via.placeholder.com/400x300?text=Image+Unavailable";
}}
/>
<div className="card-body d-flex flex-column">
<h5 className="card-title">{entity.name}</h5>
<ul className="list-unstyled text-muted small mb-4">
{config.summaryFields.map((field) => (
<li key={field}>
<strong>{formatLabel(field)}:</strong> {safeDisplayValue(entity[field])}
</li>
))}
</ul>
<div className="mt-auto d-flex justify-content-between align-items-center">
<Link to={`/details/${type}/${entity.id}`} className="btn btn-primary btn-sm">
Learn more!
</Link>
<FavoriteButton item={{ id: entity.id, name: entity.name, type }} />
</div>
</div>
</div>
</div>
);
};

EntityCard.propTypes = {
type: PropTypes.string.isRequired,
entity: PropTypes.shape({
id: PropTypes.string.isRequired,
name: PropTypes.string.isRequired
}).isRequired
};

const EntitySection = ({ type, entities, loading, error }) => (
<section className="mb-5">
<h2 className="section-title mb-3">{ENTITY_CONFIG[type].title}</h2>
{loading ? <p>Loading {ENTITY_CONFIG[type].title.toLowerCase()}...</p> : null}
{error ? <p className="text-danger">{error}</p> : null}
{!loading && !error ? (
<div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
{entities.map((entity) => (
<EntityCard key={`${type}-${entity.id}`} type={type} entity={entity} />
))}
</div>
) : null}
</section>
);

EntitySection.propTypes = {
type: PropTypes.string.isRequired,
entities: PropTypes.arrayOf(
PropTypes.shape({
id: PropTypes.string.isRequired,
name: PropTypes.string.isRequired
})
).isRequired,
loading: PropTypes.bool.isRequired,
error: PropTypes.string
};

EntitySection.defaultProps = {
error: ""
};

const HomePage = () => {
const [collections, setCollections] = useState({
people: { data: [], loading: true, error: "" },
vehicles: { data: [], loading: true, error: "" },
planets: { data: [], loading: true, error: "" }
});

useEffect(() => {
Object.keys(ENTITY_CONFIG).forEach((type) => {
fetchEntityCollection(type)
.then((data) => {
setCollections((current) => ({
...current,
[type]: { data, loading: false, error: "" }
}));
})
.catch((error) => {
setCollections((current) => ({
...current,
[type]: {
data: [],
loading: false,
error: error.message || `Unable to load ${ENTITY_CONFIG[type].title}`
}
}));
});
});
}, []);

return (
<div className="container py-4">
{Object.keys(ENTITY_CONFIG).map((type) => (
<EntitySection
key={type}
type={type}
entities={collections[type].data}
loading={collections[type].loading}
error={collections[type].error}
/>
))}
</div>
);
};

const DetailPage = () => {
const { type: rawType, id } = useParams();
const type = getApiType(rawType);
const navigate = useNavigate();
const [entity, setEntity] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const sortedFields = useMemo(() => {
if (!entity) return [];
return Object.entries(entity).filter(([key]) => key !== "id");
}, [entity]);

useEffect(() => {
if (!type || !id) {
setError("Invalid entity type");
setLoading(false);
return;
}

fetchEntityDetail(type, id)
.then((data) => {
setEntity(data);
setLoading(false);
})
.catch((requestError) => {
setError(requestError.message || "Failed to load details");
setLoading(false);
});
}, [type, id]);

if (loading) {
return <div className="container py-4">Loading details...</div>;
}

if (error || !entity || !type) {
return (
<div className="container py-4">
<p className="text-danger mb-3">{error || "Unable to load entity details"}</p>
<Link to="/" className="btn btn-outline-primary">
Back home
</Link>
</div>
);
}

return (
<div className="container py-4">
<div className="row g-4 align-items-start">
<div className="col-lg-5">
<img
src={getImageUrl(type, id)}
className="img-fluid rounded shadow-sm w-100"
alt={entity.name}
onError={(event) => {
event.currentTarget.src =
"https://via.placeholder.com/700x500?text=Image+Unavailable";
}}
/>
</div>
<div className="col-lg-7">
<div className="d-flex justify-content-between align-items-start mb-3 gap-3">
<div>
<h1 className="section-title mb-2">{entity.name}</h1>
<p className="text-muted">
Explore key facts about this {ENTITY_CONFIG[type].title.slice(0, -1).toLowerCase()} from
the Star Wars universe.
</p>
</div>
<FavoriteButton item={{ id: entity.id, name: entity.name, type }} />
</div>
<div className="table-responsive">
<table className="table table-striped table-bordered align-middle">
<thead>
<tr>
<th className="text-danger">Property</th>
<th className="text-danger">Value</th>
</tr>
</thead>
<tbody>
{sortedFields.map(([key, value]) => (
<tr key={key}>
<th scope="row">{formatLabel(key)}</th>
<td>{safeDisplayValue(value)}</td>
</tr>
))}
</tbody>
</table>
</div>
<div className="d-flex gap-2">
<button type="button" onClick={() => navigate(-1)} className="btn btn-outline-secondary">
Go back
</button>
<Link to="/" className="btn btn-primary">
Home
</Link>
</div>
</div>
</div>
</div>
);
};

const Home = () => (
<>
<Navbar />
<Routes>
<Route path="/" element={<HomePage />} />
<Route path="/details/:type/:id" element={<DetailPage />} />
<Route
path="*"
element={
<div className="container py-4">
<p className="text-danger">Page not found.</p>
<Link to="/" className="btn btn-primary">
Back home
</Link>
</div>
}
/>
</Routes>
</>
);

export default Home;
