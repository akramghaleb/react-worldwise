import {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useCallback,
} from "react";

const CitiesContext = createContext();

const BASE_URL = "http://localhost:9001";

const initialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: "",
};
function reducer(state, action) {
  switch (action.type) {
    case "LOADING":
      return { ...state, isLoading: true };
    case "CITIES_LOADED":
      return { ...state, isLoading: false, cities: action.payload };
    case "REJECTED":
      return { ...state, isLoading: false, error: action.payload };
    case "CITY_LOADED":
      return { ...state, isLoading: false, currentCity: action.payload };
    case "CITY_CREATED":
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };
    case "CITY_DELETED":
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
      };

    case "SET_CITIES":
      return { ...state, cities: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_CURRENT_CITY":
      return { ...state, currentCity: action.payload };
    default:
      throw new Error("Unknow action type");
  }
}

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(
    reducer,
    initialState
  );
  useEffect(() => {
    async function fetchCities() {
      try {
        dispatch({ type: "LOADING" });
        const res = await fetch(`${BASE_URL}/cities`);
        const data = await res.json();
        dispatch({ type: "CITIES_LOADED", payload: data });
      } catch (err) {
        dispatch({
          type: "REJECTED",
          payload: "There was an error loading cities...",
        });
      }
    }

    fetchCities();
  }, []);

  const getCity = useCallback(
    async function getCity(id) {
      if (Number(id) === currentCity.id) return;
      try {
        dispatch({ type: "LOADING" });
        const res = await fetch(`${BASE_URL}/cities/${id}`);
        const data = await res.json();
        dispatch({ type: "CITY_LOADED", payload: data });
      } catch (err) {
        dispatch({
          type: "REJECTED",
          payload: "There was an error loading the city...",
        });
      }
    },
    [currentCity.id]
  );

  async function createCity(newCity) {
    try {
      dispatch({ type: "LOADING" });
      const res = await fetch(`${BASE_URL}/cities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCity),
      });
      const data = await res.json();
      dispatch({ type: "CITY_CREATED", payload: data });
    } catch (err) {
      dispatch({
        type: "REJECTED",
        payload: "There was an error creating city data...",
      });
    }
  }

  async function deleteCity(id) {
    try {
      dispatch({ type: "LOADING" });
      await fetch(`${BASE_URL}/cities/${id}`, {
        method: "DELETE",
      });
      dispatch({ type: "CITY_DELETED", payload: id });
    } catch (err) {
      dispatch({
        type: "REJECTED",
        payload: "There was an error deleting city data...",
      });
    }
  }

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        error,
        getCity,
        createCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined)
    throw new Error("CitiesContext was used outside the CitiesProvider");
  return context;
}

export { CitiesProvider, useCities };
