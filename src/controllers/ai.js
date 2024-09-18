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
        function WeatherApp() {
          const [weather, setWeather] = React.useState(null);
          const [loading, setLoading] = React.useState(true);
          const [error, setError] = React.useState(null);
      
          React.useEffect(() => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                fetch(\`https://api.weatherapi.com/v1/current.json?key=323e6c0135f941f7a0b95629242808&q=\${latitude},\${longitude}\`)
                  .then(response => response.json())
                  .then(data => {
                    setWeather(data);
                    setLoading(false);
                  })
                  .catch(err => {
                    setError('Failed to fetch weather data');
                    setLoading(false);
                  });
              },
              () => {
                setError('Unable to retrieve your location');
                setLoading(false);
              }
            );
          }, []);
      
          if (loading) return React.createElement('div', { className: 'flex justify-center items-center h-screen' }, 'Loading...');
          if (error) return React.createElement('div', { className: 'text-red-500 text-center' }, error);
      
          return React.createElement('div', { className: 'flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-blue-600 p-4' },
            React.createElement('div', { className: 'bg-white rounded-lg shadow-xl p-6 max-w-sm w-full' },
              React.createElement('h1', { className: 'text-2xl font-bold mb-4 text-center' }, weather.location.name),
              React.createElement('div', { className: 'flex items-center justify-center mb-4' },
                React.createElement('img', { src: weather.current.condition.icon, alt: weather.current.condition.text, className: 'w-16 h-16 mr-4' }),
                React.createElement('span', { className: 'text-5xl font-bold' }, \`\${weather.current.temp_c}°C\`)
              ),
              React.createElement('p', { className: 'text-center text-gray-700 mb-4' }, weather.current.condition.text),
              React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement(Wind, { className: 'w-4 h-4 mr-2' }),
                  \`\${weather.current.wind_kph} km/h\`
                ),
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement(Droplets, { className: 'w-4 h-4 mr-2' }),
                  \`\${weather.current.humidity}%\`
                ),
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement(Thermometer, { className: 'w-4 h-4 mr-2' }),
                  \`Feels like \${weather.current.feelslike_c}°C\`
                ),
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement(Sun, { className: 'w-4 h-4 mr-2' }),
                  \`UV \${weather.current.uv}\`
                )
              )
            )
          );
        }
      
        return WeatherApp;
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