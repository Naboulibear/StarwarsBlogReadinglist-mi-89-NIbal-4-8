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
singular: "character",
imageFolder: "characters",
summaryFields: ["gender", "hair_color", "eye_color"]
},
vehicles: {
title: "Vehicles",
singular: "vehicle",
imageFolder: "vehicles",
summaryFields: ["model", "vehicle_class", "manufacturer"]
},
planets: {
title: "Planets",
singular: "planet",
imageFolder: "planets",
summaryFields: ["population", "terrain", "climate"]
}
};

const DESCRIPTIONS = {
people: {
"1": "A young farm boy from Tatooine who becomes one of the greatest Jedi in the galaxy. Known for his bravery, optimism, and connection to the Force, Luke helps defeat the Empire and redeem Darth Vader.",
"2": "A golden protocol droid designed for etiquette and translation. C-3PO is fluent in millions of languages and is famous for being nervous, talkative, and loyal to his friends.",
"3": "A resourceful astromech droid who assists pilots, repairs ships, and stores important data. R2-D2 is courageous, clever, and communicates through electronic beeps and whistles.",
"4": "A powerful Sith Lord once known as Anakin Skywalker. Wearing black armor and a mechanical breathing suit, Vader serves the Empire before ultimately returning to the light side.",
"5": "A fearless princess, military leader, and member of the Rebel Alliance. Leia is intelligent, determined, and dedicated to fighting against tyranny in the galaxy.",
"6": "A moisture farmer living on Tatooine and the uncle of Luke Skywalker. Owen is practical, protective, and tries to keep Luke away from dangerous adventures.",
"7": "Luke Skywalker's caring aunt who lives on the Lars moisture farm. Beru is compassionate and supportive, encouraging Luke to dream beyond his life on Tatooine.",
"8": "A red astromech droid originally selected by Owen Lars before malfunctioning. The breakdown leads Luke's family to purchase R2-D2 instead."
},
vehicles: {
"4": "A massive desert transport vehicle operated by Jawas on Tatooine. Sandcrawlers carry scavenged machinery, droids, and supplies across the harsh dunes.",
"6": "A high-speed civilian airspeeder used for recreation and training on Tatooine. Luke Skywalker practiced flying and target shooting with this vehicle before becoming a pilot.",
"7": "A compact hovering vehicle commonly used on Tatooine. Luke uses an X-34 landspeeder for transportation across the desert settlements.",
"8": "The standard Imperial starfighter used by the Galactic Empire. It is fast, agile, and recognizable by its twin vertical solar panel wings.",
"14": "A modified airspeeder used by the Rebel Alliance during the Battle of Hoth. Snowspeeders are equipped with harpoons and tow cables for combat against walkers.",
"16": "An advanced Imperial starfighter designed for greater speed and firepower. Its sharp wing design makes it one of the Empire's deadliest starfighters.",
"18": "A gigantic four-legged armored walker used by the Galactic Empire. AT-ATs transport troops and heavy weapons, especially during assaults like the Battle of Hoth.",
"19": "A smaller two-legged Imperial walker used for scouting and ground support. AT-STs are fast and heavily armed but less armored than AT-ATs."
},
planets: {
"1": "A desert planet with twin suns located in the Outer Rim. Tatooine is home to smugglers, moisture farmers, Jawas, and the childhood home of Luke Skywalker.",
"2": "A peaceful and beautiful world known for diplomacy and culture. Alderaan is the home planet of Leia Organa and is destroyed by the Death Star.",
"3": "A jungle-covered moon that serves as an important Rebel Alliance base. The Rebels launch their attack on the Death Star from Yavin IV.",
"4": "An icy and remote world used as a hidden Rebel base. Hoth becomes the site of a major battle between the Rebels and the Galactic Empire.",
"5": "A swamp-covered planet strong in the Force. Jedi Master Yoda lives in exile on Dagobah and trains Luke Skywalker there.",
"6": "A gas giant famous for Cloud City, a floating mining colony. Bespin becomes the location of Luke Skywalker's duel with Darth Vader.",
"7": "A forest moon inhabited by the Ewoks. The Rebel Alliance fights a crucial battle on Endor to destroy the Empire's shield generator.",
"8": "A lush planet known for its lakes, elegant cities, and peaceful culture. Naboo is the homeworld of Padmé Amidala and Emperor Palpatine."
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

const details = [];
for (const record of records) {
try {
const detail = await fetchEntityDetail(type, record.uid);
details.push(detail);
await sleep(500);
} catch (error) {
details.push({
	id: String(record.uid),
	name: record.name
});
}
}

return details;
} catch (error) {
return getFallbackCollection(type);
}
};

const FavoritesDropdown = () => {
const { favorites, removeFavorite } = useFavorites();
const [isOpen, setIsOpen] = useState(false);

return (
<div className="dropdown">
<button
className="btn btn-warning dropdown-toggle"
type="button"
onClick={() => setIsOpen(!isOpen)}
aria-expanded={isOpen}>
Favorites <span className="badge text-bg-dark ms-1">{favorites.length}</span>
</button>
<ul className={`dropdown-menu dropdown-menu-end ${isOpen ? "show" : ""}`} style={{ display: isOpen ? "block" : "none" }}>
{favorites.length === 0 ? (
<li><span className="dropdown-item text-muted">No favorites yet</span></li>
) : (
favorites.map((favorite) => (
<li key={`${favorite.type}-${favorite.id}`} className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderBottom: "1px solid #e9ecef", cursor: "pointer" }}>
<Link
className="text-decoration-none text-dark flex-grow-1"
to={`/details/${favorite.type}/${favorite.id}`}
onClick={() => setIsOpen(false)}>
{favorite.name}
</Link>
<button
type="button"
className="btn btn-sm btn-link text-danger p-0 ms-2"
onClick={(e) => {
e.preventDefault();
e.stopPropagation();
removeFavorite(favorite.type, favorite.id);
}}
aria-label={`Remove ${favorite.name} from favorites`}>
🗑
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
<div style={{ minWidth: "280px", flexShrink: 0 }}>
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
<div style={{
overflowX: "auto",
display: "flex",
gap: "1rem",
paddingBottom: "1rem",
scrollBehavior: "smooth"
}}>
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
const types = Object.keys(ENTITY_CONFIG);
let delay = 0;

types.forEach((type) => {
setTimeout(() => {
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
}, delay);

delay += 6000;
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

const customDescription = DESCRIPTIONS[type]?.[id];

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
{customDescription || `Explore key facts about this ${ENTITY_CONFIG[type].singular} from the Star Wars universe.`}
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