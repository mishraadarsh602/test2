import React, { useState } from "react";
import {
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  Sun,
  MapPin,
  Calendar,
} from "lucide-react";
interface WeatherData {
  location: { name: string; country: string };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        avgtemp_c: number;
        condition: { text: string; icon: string };
        maxwind_kph: number;
        avghumidity: number;
        daily_chance_of_rain: number;
        uv: number;
      };
    }>;
  };
}
export default function TravelWeatherTracker() {
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [fromWeather, setFromWeather] = useState<WeatherData | null>(null);
  const [toWeather, setToWeather] = useState<WeatherData | null>(null);
  const fetchWeather = async (
    city: string,
    setter: React.Dispatch<React.SetStateAction<WeatherData | null>>
  ) => {
    try {
      const response = await fetch(
        `http://api.weatherapi.com/v1/forecast.json?key=323e6c0135f941f7a0b95629242808&q=${city}&days=7`
      );
      const data = await response.json();
      setter(data);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather(fromCity, setFromWeather);
    fetchWeather(toCity, setToWeather);
  };
  const renderWeatherCard = (weather: WeatherData, title: string) => (
    <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
      {" "}
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        {" "}
        <MapPin className="mr-2" /> {title}: {weather.location.name},{" "}
        {weather.location.country}{" "}
      </h2>{" "}
      <div className="space-y-4">
        {" "}
        {weather.forecast.forecastday.map((day) => (
          <div key={day.date} className="border-t pt-4">
            {" "}
            <div className="flex justify-between items-center">
              {" "}
              <div className="flex items-center">
                {" "}
                <Calendar className="mr-2" />{" "}
                <span className="font-semibold">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center">
                {" "}
                <img
                  src={day.day.condition.icon}
                  alt={day.day.condition.text}
                  className="w-10 h-10 mr-2"
                />{" "}
                <span className="text-xl font-bold">{day.day.avgtemp_c}°C</span>{" "}
              </div>{" "}
            </div>{" "}
            <p className="text-sm text-gray-600 mt-1">
              {day.day.condition.text}
            </p>{" "}
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              {" "}
              <div className="flex items-center">
                {" "}
                <Wind className="w-4 h-4 mr-1" />{" "}
                <span>{day.day.maxwind_kph} km/h</span>{" "}
              </div>{" "}
              <div className="flex items-center">
                {" "}
                <Droplets className="w-4 h-4 mr-1" />{" "}
                <span>{day.day.avghumidity}%</span>{" "}
              </div>{" "}
              <div className="flex items-center">
                {" "}
                <Cloud className="w-4 h-4 mr-1" />{" "}
                <span>{day.day.daily_chance_of_rain}% rain</span>{" "}
              </div>{" "}
              <div className="flex items-center">
                {" "}
                <Sun className="w-4 h-4 mr-1" /> <span>UV {day.day.uv}</span>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        ))}{" "}
      </div>{" "}
    </div>
  );
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 ">
      {" "}
      <div className="max-w-4xl mx-auto">
        {" "}
        <h1 className="text-3xl font-bold text-center mb-8 text-black">
          Travel Weather Tracker
        </h1>{" "}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-xl p-6 mb-8"
        >
          {" "}
          <div className="flex flex-col md:flex-row md:space-x-4">
            {" "}
            <div className="flex-1 mb-4 md:mb-0">
              {" "}
              <label
                htmlFor="fromCity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                From City
              </label>{" "}
              <input
                id="fromCity"
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter departure city"
                required
              />{" "}
            </div>{" "}
            <div className="flex-1">
              {" "}
              <label
                htmlFor="toCity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                To City
              </label>{" "}
              <input
                id="toCity"
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter destination city"
                required
              />{" "}
            </div>{" "}
          </div>{" "}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md mt-4 hover:bg-blue-600 transition duration-300"
          >
            {" "}
            Get Weather Forecast{" "}
          </button>{" "}
        </form>{" "}
        {fromWeather && renderWeatherCard(fromWeather, "From")}{" "}
        {toWeather && renderWeatherCard(toWeather, "To")}{" "}
      </div>{" "}
    </div>
  );
}
