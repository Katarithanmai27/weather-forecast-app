const apiKey = "944d0cf9890dc8e3089535f1b1f0d3c0";

function updateRecentCities(city) {
  let recent = JSON.parse(localStorage.getItem("recentCities")) || [];
  recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
  recent.unshift(city);
  if (recent.length > 5) recent.pop();
  localStorage.setItem("recentCities", JSON.stringify(recent));
  renderRecentCities();
}

function renderRecentCities() {
  const dropdown = document.getElementById("recentDropdown");
  dropdown.innerHTML = "";
  const cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  if (cities.length === 0) {
    dropdown.classList.add("hidden");
    return;
  }
  cities.forEach(city => {
    const item = document.createElement("div");
    item.textContent = city;
    item.className = "px-4 py-2 hover:bg-blue-100 cursor-pointer border-b";
    item.onclick = () => {
      document.getElementById("cityInput").value = city;
      getWeatherByCity();
    };
    dropdown.appendChild(item);
  });
  dropdown.classList.remove("hidden");
}

function getWeatherByCity() {
  const city = document.getElementById("cityInput").value.trim();
  const errorBox = document.getElementById("error");
  const weatherBox = document.getElementById("weatherDisplay");

  if (!city) {
    errorBox.textContent = "Please enter a city name.";
    errorBox.classList.remove("hidden");
    weatherBox.classList.add("hidden");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      errorBox.classList.add("hidden");

      document.getElementById("cityName").textContent = `${data.name} (${new Date().toLocaleDateString()})`;
      document.getElementById("description").textContent = data.weather[0].description;
      document.getElementById("temp").textContent = `Temperature: ${data.main.temp} °C`;
      document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
      document.getElementById("wind").textContent = `Wind: ${data.wind.speed} m/s`;
      document.getElementById("icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

      weatherBox.classList.remove("hidden");
      fetch5DayForecast(data.name);
      updateRecentCities(data.name);
    })
    .catch((err) => {
      console.error("Error:", err.message);
      errorBox.textContent = `Error: ${err.message}`;
      errorBox.classList.remove("hidden");
      weatherBox.classList.add("hidden");
    });
}

function getWeatherByLocation() {
  const errorBox = document.getElementById("error");

  if (!navigator.geolocation) {
    errorBox.textContent = "Geolocation is not supported by your browser.";
    errorBox.classList.remove("hidden");
    return;
  }

  navigator.geolocation.getCurrentPosition(success, error);

  function success(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        errorBox.classList.add("hidden");

        document.getElementById("weatherDisplay").classList.remove("hidden");
        document.getElementById("cityName").textContent = `${data.name} (${new Date().toLocaleDateString()})`;
        document.getElementById("description").textContent = data.weather[0].description;
        document.getElementById("temp").textContent = `Temperature: ${data.main.temp}°C`;
        document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
        document.getElementById("wind").textContent = `Wind: ${data.wind.speed} m/s`;
        document.getElementById("icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

        fetch5DayForecast(data.name);
        updateRecentCities(data.name);
      })
      .catch(err => {
        console.error(err);
        errorBox.textContent = "Unable to fetch weather for current location.";
        errorBox.classList.remove("hidden");
      });
  }

  function error() {
    errorBox.textContent = "Permission denied or unable to get your location.";
    errorBox.classList.remove("hidden");
  }
}

function fetch5DayForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const forecastContainer = document.getElementById("forecastCards");
      forecastContainer.innerHTML = "";

      const dailyData = {};

      data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        const hour = item.dt_txt.split(" ")[1];

        if (hour === "12:00:00" && !dailyData[date]) {
          dailyData[date] = item;
        }
      });

      const forecastDays = Object.keys(dailyData).slice(0, 5);

      forecastDays.forEach(date => {
        const item = dailyData[date];
        const card = document.createElement("div");
        card.className = "bg-white rounded shadow p-4 text-center";

        card.innerHTML = `
          <h4 class="font-semibold mb-1">${new Date(date).toDateString()}</h4>
          <img class="mx-auto" src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="icon" />
          <p class="capitalize">${item.weather[0].description}</p>
          <p> ${item.main.temp} °C</p>
          <p> ${item.main.humidity}%</p>
          <p> ${item.wind.speed} m/s</p>
        `;

        forecastContainer.appendChild(card);
      });

      document.getElementById("forecast").classList.remove("hidden");
    })
    .catch(err => {
      console.error("Forecast error:", err);
      document.getElementById("forecast").classList.add("hidden");
    });
}

window.onload = renderRecentCities;
