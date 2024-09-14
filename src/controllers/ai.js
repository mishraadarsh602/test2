const systemPromptSession = require('../models/chat/systemPrompt.model');
const App = require('../models/app');
const { Anthropic } = require('@anthropic-ai/sdk');

const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'],
});
module.exports = {

    createAppByAI: async (req, res) => {
        try {
            let aiData = req.body;
            const prompts = await systemPromptSession.findOne({});
            let parentPrompt = prompts?.parentPrompt;
            let apiList = `[
                {
                    API: 'http://api.weatherapi.com/v1/forecast.json?q=gurgaon&key=YOUR_API&days=2',
                    Purpose: 'To retrieve the 2-day weather forecast (current day and next day) for a specific location, including hourly updates.',
                    key: 'FORCAST'
                },
                {
                    API: 'http://api.weatherapi.com/v1/current.json?q=mumbai&key=YOUR_API&aqi=yes',
                    Purpose: 'To get the  weather data of particular location  of current date and time',
                    key: 'FORCAST'
                }
            ]`

            parentPrompt = parentPrompt.replace('{userInput}', aiData.customPrompt);
            parentPrompt = parentPrompt.replace('{apiList}', apiList);
            // console.log("parentPrompt", parentPrompt)
            const message = await client.messages.create({
                max_tokens: 1024,
                messages: [{ role: 'user', content: parentPrompt }],
                model: 'claude-3-5-sonnet-20240620',
            });
            let parentResponse = JSON.parse(message.content[0].text.trim());
            console.log(parentResponse);

            let waitForChildOperation = await CALLAI(parentResponse,prompts,aiData);

            res.status(200).json({
                message: "Prompt Chaining",
                data: waitForChildOperation,
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    callAPI: async (req, res) => { // get called from live APP( as live app dont have api only parentApp have)
        try {
            let body = req.body;
            const app = await App.findOne({ parentApp: body.parentApp });
            const response = await fetch(`${app.api}`);
            const data = await response.json();
            res.status(200).json({
                message: "API Called",
                data,
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    returnCode: async (req, res) => { // get called from live APP( as live app dont have api only parentApp have)
        try {
            const app = await App.findOne({ _id: "66e2cbe8ecccb0a4162b2b0c" });
            console.log("ashish",app['componentCode'])
            res.status(200).json({
                code: app['componentCode']
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

async function CALLAI(parentResponse, prompts,aiData) {
    if (parentResponse && parentResponse.ToolTYPE === 'AIBASED') {
        let childPrompt = prompts?.childPrompt?.aibased;
        let reactCode = `
        function WeatherTracker() {
          const [fromCity, setFromCity] = React.useState("");
          const [toCity, setToCity] = React.useState("");
          const [fromWeather, setFromWeather] = React.useState(null);
          const [toWeather, setToWeather] = React.useState(null);
          const [loading, setLoading] = React.useState(false);
          const [error, setError] = React.useState(null);
        
          const fetchWeather = async (city, setter) => {
            setLoading(true);
            setError(null);
            try {
              const response = await fetch(
                \`https://api.weatherapi.com/v1/forecast.json?key=323e6c0135f941f7a0b95629242808&q=\${city}&days=7\`
              );
              if (!response.ok) {
                throw new Error('Failed to fetch weather data');
              }
              const data = await response.json();
              setter(data);
            } catch (error) {
              console.error("Error fetching weather data:", error);
              setError("Failed to fetch weather data. Please try again.");
            } finally {
              setLoading(false);
            }
          };
        
          const handleSubmit = (e) => {
            e.preventDefault();
            fetchWeather(fromCity, setFromWeather);
            fetchWeather(toCity, setToWeather);
          };
        
          const renderWeatherCard = (weather, title) => {
            if (!weather) return null;
            return React.createElement('div', { className: "bg-white rounded-lg shadow-xl p-6 mb-6", key: title },
              React.createElement('h2', { className: "text-2xl font-bold mb-4 flex items-center" },
                React.createElement(MapPin, { className: "mr-2" }),
                \`\${title}: \${weather.location.name}, \${weather.location.country}\`
              ),
              React.createElement('p', { className: "text-sm text-gray-600 mb-4" }, \`Local time: \${weather.location.localtime}\`),
              React.createElement('div', { className: "mb-4 flex items-center" },
                React.createElement('img', { src: weather.current.condition.icon, alt: weather.current.condition.text, className: "w-16 h-16 mr-4" }),
                React.createElement('div', null,
                  React.createElement('p', { className: "text-4xl font-bold" }, \`\${weather.current.temp_c}°C\`),
                  React.createElement('p', { className: "text-lg" }, weather.current.condition.text)
                )
              ),
              React.createElement('div', { className: "grid grid-cols-2 gap-4 mb-4" },
                React.createElement('div', null,
                  React.createElement('p', { className: "font-semibold" }, "Feels like"),
                  React.createElement('p', null, \`\${weather.current.feelslike_c}°C\`)
                ),
                React.createElement('div', null,
                  React.createElement('p', { className: "font-semibold" }, "Wind"),
                  React.createElement('p', null, \`\${weather.current.wind_kph} km/h\`)
                ),
                React.createElement('div', null,
                  React.createElement('p', { className: "font-semibold" }, "Humidity"),
                  React.createElement('p', null, \`\${weather.current.humidity}%\`)
                ),
                React.createElement('div', null,
                  React.createElement('p', { className: "font-semibold" }, "UV Index"),
                  React.createElement('p', null, weather.current.uv)
                )
              ),
              React.createElement('h3', { className: "text-xl font-semibold mb-2" }, "7-Day Forecast"),
              React.createElement('div', { className: "space-y-4" },
                weather.forecast.forecastday.map((day) => 
                  React.createElement('div', { key: day.date, className: "border-t pt-4" },
                    React.createElement('div', { className: "flex justify-between items-center" },
                      React.createElement('div', { className: "flex items-center" },
                        React.createElement(Calendar, { className: "mr-2" }),
                        React.createElement('span', { className: "font-semibold" },
                          new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })
                        )
                      ),
                      React.createElement('div', { className: "flex items-center" },
                        React.createElement('img', {
                          src: day.day.condition.icon,
                          alt: day.day.condition.text,
                          className: "w-10 h-10 mr-2"
                        }),
                        React.createElement('span', { className: "text-xl font-bold" }, \`\${day.day.avgtemp_c}°C\`)
                      )
                    ),
                    React.createElement('p', { className: "text-sm text-gray-600 mt-1" }, day.day.condition.text),
                    React.createElement('div', { className: "grid grid-cols-2 gap-2 mt-2 text-sm" },
                      React.createElement('div', { className: "flex items-center" },
                        React.createElement(Wind, { className: "w-4 h-4 mr-1" }),
                        React.createElement('span', null, \`\${day.day.maxwind_kph} km/h\`)
                      ),
                      React.createElement('div', { className: "flex items-center" },
                        React.createElement(Droplets, { className: "w-4 h-4 mr-1" }),
                        React.createElement('span', null, \`\${day.day.avghumidity}%\`)
                      ),
                      React.createElement('div', { className: "flex items-center" },
                        React.createElement(Cloud, { className: "w-4 h-4 mr-1" }),
                        React.createElement('span', null, \`\${day.day.daily_chance_of_rain}% rain\`)
                      ),
                      React.createElement('div', { className: "flex items-center" },
                        React.createElement(Sun, { className: "w-4 h-4 mr-1" }),
                        React.createElement('span', null, \`UV \${day.day.uv}\`)
                      )
                    )
                  )
                )
              )
            );
          };
        
          return React.createElement('div', { className: "min-h-screen bg-gray-100 p-4 md:p-8" },
            React.createElement('div', { className: "max-w-4xl mx-auto" },
              React.createElement('h1', { className: "text-3xl font-bold text-center mb-8 text-black" }, "Travel Weather Tracker"),
              React.createElement('form', { onSubmit: handleSubmit, className: "bg-white rounded-lg shadow-xl p-6 mb-8" },
                React.createElement('div', { className: "flex flex-col md:flex-row md:space-x-4" },
                  React.createElement('div', { className: "flex-1 mb-4 md:mb-0" },
                    React.createElement('label', { htmlFor: "fromCity", className: "block text-sm font-medium text-gray-700 mb-1" }, "From City"),
                    React.createElement('input', {
                      id: "fromCity",
                      type: "text",
                      value: fromCity,
                      onChange: (e) => setFromCity(e.target.value),
                      className: "w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      placeholder: "Enter departure city",
                      required: true
                    })
                  ),
                  React.createElement('div', { className: "flex-1" },
                    React.createElement('label', { htmlFor: "toCity", className: "block text-sm font-medium text-gray-700 mb-1" }, "To City"),
                    React.createElement('input', {
                      id: "toCity",
                      type: "text",
                      value: toCity,
                      onChange: (e) => setToCity(e.target.value),
                      className: "w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      placeholder: "Enter destination city",
                      required: true
                    })
                  )
                ),
                React.createElement('button', { 
                  type: "submit", 
                  className: "w-full bg-blue-500 text-white py-2 px-4 rounded-md mt-4 hover:bg-blue-600 transition duration-300",
                  disabled: loading
                }, loading ? "Loading..." : "Get Weather Forecast")
              ),
              error && React.createElement('div', { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" }, error),
              fromWeather && renderWeatherCard(fromWeather, "From"),
              toWeather && renderWeatherCard(toWeather, "To")
            )
          );
        }
        return WeatherTracker;
      `;
        childPrompt = childPrompt.replace('{userInput}', aiData.customPrompt);
        childPrompt = childPrompt.replace('{reactCode}', reactCode);
        const mesg = await client.messages.create({
            max_tokens: 8192,
            messages: [{ role: 'user', content: childPrompt }],
            model: 'claude-3-5-sonnet-20240620',
        });
        let childResponse = mesg.content[0].text.trim();
        console.log(childResponse);
        // let message = (childResponse).split("@$@$@$");
        // let obj = { code: message[0], message: message[1] };
        const app = await App.findOne({ _id: "66e2cbe8ecccb0a4162b2b0c" });
        app.componentCode = childResponse;
        await app.save()
        return app;
    }
    else if (parentResponse && parentResponse.ToolTYPE === 'APIBASED') {
        let childPrompt = prompts?.childPrompt?.apibased;
        childPrompt = childPrompt.replace('{userInput}', aiData.customPrompt);
        // console.log(childPrompt)
        const app = await App.findOne({ _id: "66e2cbe8ecccb0a4162b2b0c" });
        // app.componentCode = childResponse;
        // await app.save()
        return app;
    }
}