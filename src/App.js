import {
  Content,
  Container,
  Field,
  Control,
  Label,
  Input,
  Button,
  Select,
  Title,
  Textarea,
  Navbar,
  Hero,
  Column
} from "rbx";

import "./App.css";
import { DisplayFormikState } from "./helper";
import { Map, Marker, GoogleApiWrapper } from "google-maps-react";

import { usePosition } from "use-position";

import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email")
});

const App = ({ google }) => {
  const { latitude, longitude } = usePosition();
  const formik = useFormik({
    initialValues: {
      usedChannel: "Llamada",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      place: "",
      street: "",
      neighborhood: "",
      city: "",
      department: "",
      complaintType: "aglomeracion",
      observations: "",
      geo: null,
      complaintState: "pendiente"
    },
    onSubmit: async values => {
      await new Promise(resolve => setTimeout(resolve, 500));
      alert(JSON.stringify(values, null, 2));
    },
    validationSchema
  });
  const {
    values,
    touched,
    errors,
    dirty,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    handleReset,
    setFieldValue
  } = formik;

  const [markerPosition, setMarkerPosition] = useState(null);
  const [place, setPlace] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const positionAvailable = latitude && longitude;
  const mapRef = useRef(null);
  const autocomplete = useRef(null);
  const autocompleteService = useRef(null);
  const geocoder = useRef(null);
  const autocompleteEl = useRef(null);

  const callGeocoderAPI = ({ latlng }) => {
    geocoder.current.geocode({ location: latlng }, function(results, status) {
      if (status === "OK") {
        if (results[0]) {
          setStreet(results[0].formatted_address);
          setFieldValue("street", results[0].formatted_address, true);
          const addressComponents = results[0].address_components;
          const city = addressComponents.find(component => {
            return component.types.find(type => type === "locality");
          });
          const country = addressComponents.find(component => {
            return component.types.find(type => type === "country");
          });
          setCity(city.long_name);
          setCountry(country.long_name);
          setFieldValue("city", city.long_name, true);
        }
      } else {
        console.error("Geocoder failed due to: " + status);
      }
    });
  };

  const placeChangedHandler = () => {
    //* This only have data when a place is selected from autcomplete dropdown
    try {
      const place = autocomplete.current.getPlace();
      const location = place.geometry.location;
      if (place) {
        const latlng = {
          lat: parseFloat(location.lat()),
          lng: parseFloat(location.lng())
        };
        setPlace(place.name);
        setFieldValue("geo", latlng, true);
        setFieldValue("place", place.name, true);
        callGeocoderAPI({ latlng });
        setMarkerPosition(latlng);
      }
    } catch (err) {
      setPlace(autocompleteEl.current.value);
      console.error(err);
    }
  };

  const markerHandler = (mapProps, map, e) => {
    const latlng = {
      lat: parseFloat(e.latLng.lat()),
      lng: parseFloat(e.latLng.lng())
    };
    setFieldValue("geo", latlng, true);
    callGeocoderAPI({ latlng });
    setMarkerPosition(latlng);
  };

  useEffect(() => {
    setMarkerPosition({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  const fetchPlaces = (mapProps, map) => {
    const { google } = mapProps;

    const options = {
      types: ["establishment"],
      componentRestrictions: { country: "py" }
    };

    geocoder.current = new google.maps.Geocoder();

    autocomplete.current = new google.maps.places.Autocomplete(
      autocompleteEl.current,
      options
    );

    autocompleteService.current = new google.maps.places.AutocompleteService();

    autocomplete.current.addListener("place_changed", placeChangedHandler);
  };

  return (
    <React.Fragment>
      <Navbar color="primary">
        <Container>
          <Navbar.Brand>
            <Navbar.Item>
              <Title size="2" spaced>
                Covid19-PY
              </Title>
              <Title size="5" subtitle>
                Sistema de gestión de denuncias y reportes
              </Title>
            </Navbar.Item>
            <Navbar.Burger />
          </Navbar.Brand>
          <Navbar.Menu>
            <Navbar.Segment align="end">
              <Navbar.Item>Inicio</Navbar.Item>
              <Navbar.Item active>Gestión de denuncias</Navbar.Item>
              <Navbar.Item>Reportes</Navbar.Item>
            </Navbar.Segment>
          </Navbar.Menu>
        </Container>
      </Navbar>
      <Hero>
        <Hero.Body>
          <Container>
            <Column size="8">
              <Title>Gestión de denuncias</Title>

              <form
                onSubmit={handleSubmit}
                onKeyDown={e => {
                  if ((e.charCode || e.keyCode) === 13) {
                    e.preventDefault();
                  }
                }}
              >
                <Field>
                  <Label htmlFor="usedChannel">Canal de denuncia</Label>
                  <Control>
                    <Select.Container fullwidth>
                      <Select
                        id="usedChannel"
                        name="usedChannel"
                        value={values.usedChannel}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <Select.Option value="llamada" label="Llamada">
                          Llamada
                        </Select.Option>
                        <Select.Option
                          value="redes_sociales"
                          label="Redes Sociales"
                        >
                          Redes Sociales
                        </Select.Option>
                        <Select.Option value="email" label="Correo electrónico">
                          Correo electrónico
                        </Select.Option>
                        <Select.Option value="otros" label="Otros">
                          Redes Sociales
                        </Select.Option>
                      </Select>
                    </Select.Container>
                  </Control>
                </Field>

                <Field>
                  <Label htmlFor="firstName">Nombre</Label>
                  <Control>
                    <Input
                      id="firstName"
                      placeholder="Nombre del denunciante"
                      type="text"
                      value={values.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={
                        errors.firstName && touched.firstName
                          ? "text-input error"
                          : "text-input"
                      }
                    />
                    {errors.firstName && touched.firstName && (
                      <div className="input-feedback">{errors.firstName}</div>
                    )}
                  </Control>
                </Field>

                <Field>
                  <Label htmlFor="lastName">Apellido</Label>
                  <Control>
                    <Input
                      id="lastName"
                      placeholder="Apellido del denunciante"
                      type="text"
                      value={values.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={
                        errors.lastName && touched.lastName
                          ? "text-input error"
                          : "text-input"
                      }
                    />
                    {errors.lastName && touched.lastName && (
                      <div className="input-feedback">{errors.lastName}</div>
                    )}
                  </Control>
                </Field>
                <Field>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Control>
                    <Input
                      id="phone"
                      placeholder="Número de celular o línea baja del denunciante"
                      type="tel"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={
                        errors.phone && touched.phone
                          ? "text-input error"
                          : "text-input"
                      }
                    />
                    {errors.phone && touched.phone && (
                      <div className="input-feedback">{errors.phone}</div>
                    )}
                  </Control>
                </Field>

                <Field>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Control>
                    <Input
                      id="email"
                      placeholder="Correo electrónico del denunciante"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={
                        errors.email && touched.email
                          ? "text-input error"
                          : "text-input"
                      }
                    />
                    {errors.email && touched.email && (
                      <div className="input-feedback">{errors.email}</div>
                    )}
                  </Control>
                </Field>

                <Field>
                  <Label htmlFor="complaintType">Tipo de denuncia</Label>
                  <Control>
                    <Select.Container fullwidth>
                      <Select
                        id="complaintType"
                        name="complaintType"
                        value={values.complaintType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <Select.Option
                          value="aglomeracion"
                          label="Aglomeración en espacio público"
                        >
                          Aglomeración en espacio público
                        </Select.Option>
                        <Select.Option
                          value="medidas_sanitarias"
                          label="Incumplimiento de medidas sanitarias"
                        >
                          Incumplimiento de medidas sanitarias
                        </Select.Option>
                        <Select.Option
                          value="cuarentena"
                          label="Incumplimiento de cuarentena"
                        >
                          Incumplimiento de cuarentena
                        </Select.Option>
                        <Select.Option
                          value="sintomas"
                          label="Reporte de síntomas"
                        >
                          Reporte de síntomas
                        </Select.Option>
                        <Select.Option value="otros" label="Otros">
                          Otros
                        </Select.Option>
                      </Select>
                    </Select.Container>
                    {errors.complaintType && touched.complaintType && (
                      <div className="input-feedback">
                        {errors.complaintType}
                      </div>
                    )}
                  </Control>
                </Field>

                <Field>
                  <Label htmlFor="place">Lugar</Label>
                  <Control>
                    <Input
                      id="place"
                      ref={autocompleteEl}
                      placeholder="Ingresa el lugar"
                      type="text"
                      value={values.place}
                      onChange={handleChange}
                      onKeyPress={e => {
                        e.stopPropagation();
                      }}
                      onBlur={handleBlur}
                      className={
                        errors.place && touched.place
                          ? "text-input error"
                          : "text-input"
                      }
                    />
                    {errors.place && touched.place && (
                      <div className="input-feedback">{errors.place}</div>
                    )}
                  </Control>
                </Field>

                <Field>
                  <Label htmlFor="street">Dirección</Label>
                  <Control>
                    <Input
                      id="street"
                      placeholder=""
                      type="tel"
                      value={street}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={
                        errors.street && touched.street
                          ? "text-input error"
                          : "text-input"
                      }
                    />
                    {errors.street && touched.street && (
                      <div className="input-feedback">{errors.street}</div>
                    )}
                  </Control>
                </Field>
                <Field>
                  <Label htmlFor="city">Ciudad</Label>
                  <Control>
                    <Input
                      id="city"
                      placeholder=""
                      type="tel"
                      value={city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={
                        errors.city && touched.city
                          ? "text-input error"
                          : "text-input"
                      }
                    />
                    {errors.city && touched.city && (
                      <div className="input-feedback">{errors.city}</div>
                    )}
                  </Control>
                </Field>

                <Field>
                  {positionAvailable ? (
                    <>
                      <Label htmlFor="complaintType">Ubicación</Label>
                      <Map
                        ref={mapRef}
                        google={google}
                        containerStyle={{
                          height: "40vh",
                          width: "100%",
                          position: "relative"
                        }}
                        initialCenter={{
                          lat: latitude,
                          lng: longitude
                        }}
                        center={markerPosition}
                        onClick={markerHandler}
                        onReady={fetchPlaces}
                        zoom={15}
                      >
                        <Marker
                          onClick={() => console.log("clicked")}
                          name={"Current location"}
                          position={markerPosition}
                          draggable={true}
                          onDragend={markerHandler}
                        />
                      </Map>
                    </>
                  ) : (
                    <Label>Loading...</Label>
                  )}
                </Field>

                <Field>
                  <Label htmlFor="observations">Observaciones</Label>
                  <Control>
                    <Textarea
                      id="observations"
                      placeholder=""
                      type="tel"
                      value={values.observations}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={
                        errors.observations && touched.observations
                          ? "text-input error"
                          : "text-input"
                      }
                    />
                    {errors.observations && touched.observations && (
                      <div className="input-feedback">
                        {errors.observations}
                      </div>
                    )}
                  </Control>
                </Field>

                <Field kind="group">
                  <Button.Group size="large">
                    <Button rounded color="success" disabled={isSubmitting}>
                      Submit
                    </Button>

                    <Button
                      rounded
                      color="danger"
                      outlined
                      type="button"
                      className="outline"
                      onClick={handleReset}
                      disabled={!dirty || isSubmitting}
                    >
                      Reset
                    </Button>
                  </Button.Group>
                </Field>

                {process.env.NODE_ENV !== "production" && (
                  <DisplayFormikState {...formik} />
                )}
              </form>
            </Column>
          </Container>
        </Hero.Body>
      </Hero>
    </React.Fragment>
  );
};

export default GoogleApiWrapper({
  apiKey: process.env.REACT_APP_GMAPS_API_KEY, // google maps key
  language: "es-419",
  libraries: ["places"]
})(App);
